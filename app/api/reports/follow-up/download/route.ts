
import { NextRequest, NextResponse } from 'next/server';
import * as ExcelJS from 'exceljs';
import { verifySession } from '@/lib/auth';
import type { FollowUp } from '@/types';
import { getAllFollowUps } from '@/app/(app)/leads-list/actions';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export async function POST(request: NextRequest) {
    const session = await verifySession();
    if (!session?.userId) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    try {
        const { from, to, userId } = await request.json();
        
        if (!from || !to) {
            return NextResponse.json({ error: 'Date range is required.' }, { status: 400 });
        }

        const allFollowUps = await getAllFollowUps();
        
        const dateInterval = { start: startOfDay(parseISO(from)), end: endOfDay(parseISO(to)) };

        const reportData = allFollowUps.filter(followUp => {
            const dateMatches = isWithinInterval(parseISO(followUp.createdAt), dateInterval);
            
            let userMatches = true;
            if (userId && userId !== 'all') {
                userMatches = followUp.createdById === userId;
            }
            
            return dateMatches && userMatches;
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Follow-up Report');
        
        worksheet.columns = [
            { header: 'Sr. No.', key: 'sr', width: 10 },
            { header: 'Date & Time', key: 'dateTime', width: 25 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Contact', key: 'contact', width: 20 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Comment', key: 'comment', width: 50 },
            { header: 'User', key: 'user', width: 20 },
        ];
        
        worksheet.getRow(1).font = { bold: true };
        
        reportData.forEach((row, index) => {
            const customer = row.lead || row.client;
            worksheet.addRow({
                sr: index + 1,
                dateTime: format(parseISO(row.createdAt), 'dd-MM-yyyy p'),
                name: customer?.name || '-',
                contact: customer?.phone || '-',
                type: row.type,
                comment: row.comment,
                user: row.createdBy,
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        
        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="follow_up_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
            },
        });

    } catch (error) {
        console.error('Failed to generate follow-up report:', error);
        return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
    }
}
