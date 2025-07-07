
'use server';

import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { differenceInMinutes, format, startOfDay, endOfDay } from 'date-fns';
import type { Attendance } from '@/types';

// Helper to format duration from minutes to "Xh Ym"
function formatDuration(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

// Helper to map Prisma attendance to frontend Attendance type
function mapPrismaAttendance(attendance: any): Attendance {
    return {
        id: attendance.id,
        userId: attendance.userId,
        userName: attendance.user.name,
        punchInTime: format(new Date(attendance.punchInTime), 'dd-MM-yyyy HH:mm:ss'),
        punchOutTime: attendance.punchOutTime ? format(new Date(attendance.punchOutTime), 'dd-MM-yyyy HH:mm:ss') : null,
        punchInLocation: attendance.punchInLocation,
        punchOutLocation: attendance.punchOutLocation,
        workDuration: formatDuration(attendance.workDuration),
    };
}

export async function getCurrentUserAttendanceStatus(): Promise<{ isPunchedIn: boolean; punchInTime?: string; }> {
    const session = await verifySession();
    if (!session?.userId) return { isPunchedIn: false };

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const lastPunch = await prisma.attendance.findFirst({
        where: {
            userId: session.userId,
            punchInTime: {
                gte: todayStart,
                lte: todayEnd,
            },
        },
        orderBy: {
            punchInTime: 'desc',
        },
    });

    if (lastPunch && !lastPunch.punchOutTime) {
        return {
            isPunchedIn: true,
            punchInTime: format(lastPunch.punchInTime, "HH:mm:ss"),
        };
    }

    return { isPunchedIn: false };
}

export async function punchIn(location: { latitude: number; longitude: number }): Promise<{ success: boolean; error?: string }> {
    const session = await verifySession();
    if (!session?.userId) {
        return { success: false, error: 'Authentication required.' };
    }

    const { isPunchedIn } = await getCurrentUserAttendanceStatus();
    if (isPunchedIn) {
        return { success: false, error: 'You are already punched in.' };
    }

    try {
        await prisma.attendance.create({
            data: {
                userId: session.userId,
                punchInLocation: `${location.latitude},${location.longitude}`,
            },
        });
        revalidatePath('/dashboard');
        revalidatePath('/attendance');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Database operation failed.' };
    }
}

export async function punchOut(location: { latitude: number; longitude: number }): Promise<{ success: boolean; error?: string }> {
    const session = await verifySession();
    if (!session?.userId) {
        return { success: false, error: 'Authentication required.' };
    }

    const lastPunch = await prisma.attendance.findFirst({
        where: { userId: session.userId, punchOutTime: null },
        orderBy: { punchInTime: 'desc' },
    });

    if (!lastPunch) {
        return { success: false, error: 'No active punch-in found.' };
    }
    
    const punchOutTime = new Date();
    const duration = differenceInMinutes(punchOutTime, lastPunch.punchInTime);

    try {
        await prisma.attendance.update({
            where: { id: lastPunch.id },
            data: {
                punchOutTime,
                punchOutLocation: `${location.latitude},${location.longitude}`,
                workDuration: duration,
            },
        });
        revalidatePath('/dashboard');
        revalidatePath('/attendance');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Database operation failed.' };
    }
}

export async function getAllAttendanceRecords(): Promise<Attendance[]> {
    try {
        const records = await prisma.attendance.findMany({
            include: { user: { select: { name: true } } },
            orderBy: { punchInTime: 'desc' },
        });
        return records.map(mapPrismaAttendance);
    } catch (error) {
        console.error('Failed to get attendance records:', error);
        return [];
    }
}
