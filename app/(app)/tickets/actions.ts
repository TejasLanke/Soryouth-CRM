
'use server';

import prisma from '@/lib/prisma';
import type { Tickets, CreateTicketData } from '@/types';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth';
import { parseISO } from 'date-fns';

function mapPrismaTicket(ticket: any): Tickets {
    return {
        ...ticket,
        dueDate: ticket.dueDate.toISOString(),
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
    };
}

export async function createTicket(data: CreateTicketData): Promise<Tickets | { error: string }> {
    const session = await verifySession();
    if (!session?.userId) {
        return { error: 'Authentication required.' };
    }

    try {
        const newTicket = await prisma.ticket.create({
            data: {
                // Client snapshot fields
                clientName: data.clientName,
                mobileNo: data.mobileNo,
                email: data.email,
                address: data.address,
                
                // Ticket specific fields
                ticketFor: data.ticketFor,
                priority: data.priority,
                status: data.status,
                subject: data.subject,
                description: data.description,
                dueDate: parseISO(data.dueDate),
                
                // Relational fields
                clientId: data.clientId,
                dealId: data.dealId,
                assignedToId: data.assignedToId,
                createdById: session.userId,
            },
            include: {
                client: true,
                deal: true,
                createdBy: true,
                assignedTo: true,
            }
        });
        revalidatePath('/tickets');
        return mapPrismaTicket(newTicket);
    } catch (error) {
        console.error('Failed to create ticket:', error);
        return { error: 'An unexpected error occurred.' };
    }
}

export async function getTickets(): Promise<Tickets[]> {
    try {
        const tickets = await prisma.ticket.findMany({
            include: {
                client: true,
                deal: true,
                createdBy: true,
                assignedTo: true,
            },
            orderBy: {
                dueDate: 'asc',
            },
        });
        return tickets.map(mapPrismaTicket);
    } catch (error) {
        console.error('Failed to get tickets:', error);
        return [];
    }
}
