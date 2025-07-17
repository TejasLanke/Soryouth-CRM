
'use server';

import prisma from '@/lib/prisma';
import type { GeneralTask, CreateGeneralTaskData, GeneralTaskStatus } from '@/types';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth';

// Helper to map Prisma GeneralTask to frontend type
function mapPrismaGeneralTask(task: any): GeneralTask {
    return {
        id: task.id,
        comment: task.comment,
        taskDate: task.taskDate,
        priority: task.priority,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        assignedToId: task.assignedToId,
        assignedTo: {
            id: task.assignedTo.id,
            name: task.assignedTo.name,
        },
        createdById: task.createdById,
        createdBy: task.createdBy ? {
            id: task.createdBy.id,
            name: task.createdBy.name,
        } : null,
    };
}


export async function createGeneralTask(data: CreateGeneralTaskData): Promise<GeneralTask | { error: string }> {
    const session = await verifySession();
    if (!session?.userId) {
        return { error: 'Authentication required.' };
    }

    try {
        const newTask = await prisma.generalTask.create({
            data: {
                ...data,
                createdById: session.userId,
                status: 'Pending', // Default status
            },
            include: {
                assignedTo: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            }
        });
        revalidatePath('/tasks');
        return mapPrismaGeneralTask(newTask);
    } catch (error) {
        console.error('Failed to create general task:', error);
        return { error: 'An unexpected error occurred.' };
    }
}

export async function getGroupedGeneralTasks(): Promise<Record<string, { user: { id: string, name: string }, tasks: GeneralTask[] }>> {
    try {
        const tasks = await prisma.generalTask.findMany({
            include: { 
                assignedTo: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { taskDate: 'asc' },
        });

        const grouped: Record<string, { user: { id: string, name: string }, tasks: GeneralTask[] }> = {};

        for (const task of tasks) {
            if (!grouped[task.assignedToId]) {
                grouped[task.assignedToId] = {
                    user: { id: task.assignedTo.id, name: task.assignedTo.name },
                    tasks: [],
                };
            }
            grouped[task.assignedToId].tasks.push(mapPrismaGeneralTask(task));
        }
        return grouped;
    } catch (error) {
        console.error('Failed to get all general tasks:', error);
        return {};
    }
}

export async function updateGeneralTaskStatus(taskId: string, status: GeneralTaskStatus): Promise<{ success: boolean, error?: string }> {
    const session = await verifySession();
    if (!session?.userId) {
        return { success: false, error: 'Authentication required.' };
    }

    try {
        await prisma.generalTask.update({
            where: { id: taskId },
            data: {
                status: status,
            },
        });
        revalidatePath('/tasks');
        return { success: true };
    } catch (error) {
        console.error(`Failed to update task ${taskId}:`, error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function getOpenGeneralTasksForCurrentUser(): Promise<GeneralTask[]> {
  const session = await verifySession();
  if (!session?.userId) return [];

  try {
    const tasks = await prisma.generalTask.findMany({
      where: {
        assignedToId: session.userId,
        status: {
          notIn: ['Completed', 'Failed']
        }
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: {
        taskDate: 'asc',
      },
    });

    return tasks.map(mapPrismaGeneralTask);
  } catch (error) {
    console.error("Failed to fetch general tasks for current user:", error);
    return [];
  }
}
