
'use server';

import prisma from '@/lib/prisma';
import type { DroppedLead, FollowUp, LeadStatusType } from '@/types';
import { revalidatePath } from 'next/cache';
import { format, parseISO } from 'date-fns';

function mapPrismaDroppedLeadToDroppedLeadType(prismaLead: any): DroppedLead {
  return {
    id: prismaLead.id,
    name: prismaLead.name,
    status: 'Lost',
    createdAt: prismaLead.createdAt.toISOString(),
    droppedAt: prismaLead.droppedAt.toISOString(),
    email: prismaLead.email ?? undefined,
    phone: prismaLead.phone ?? undefined,
    source: prismaLead.source ?? undefined,
    assignedTo: prismaLead.assignedTo?.name ?? undefined,
    createdBy: prismaLead.createdBy?.name ?? undefined,
    lastCommentText: prismaLead.lastCommentText ?? undefined,
    lastCommentDate: prismaLead.lastCommentDate ? format(prismaLead.lastCommentDate, 'dd-MM-yyyy') : undefined,
    nextFollowUpDate: prismaLead.nextFollowUpDate ? format(prismaLead.nextFollowUpDate, 'yyyy-MM-dd') : undefined,
    nextFollowUpTime: prismaLead.nextFollowUpTime ?? undefined,
    kilowatt: prismaLead.kilowatt === null ? undefined : prismaLead.kilowatt,
    address: prismaLead.address ?? undefined,
    priority: prismaLead.priority ?? undefined,
    dropReason: prismaLead.dropReason,
    dropComment: prismaLead.dropComment ?? undefined,
    clientType: prismaLead.clientType ?? undefined,
    electricityBillUrl: prismaLead.electricityBillUrl ?? undefined,
    followupCount: prismaLead.followUps?.length ?? 0,
  };
}

function mapPrismaFollowUpToFollowUpType(prismaFollowUp: any): FollowUp {
  return {
    id: prismaFollowUp.id,
    leadId: prismaFollowUp.leadId ?? undefined,
    clientId: prismaFollowUp.clientId ?? undefined,
    droppedLeadId: prismaFollowUp.droppedLeadId ?? undefined,
    type: prismaFollowUp.type,
    date: prismaFollowUp.date.toISOString(),
    time: prismaFollowUp.time ?? undefined,
    status: prismaFollowUp.status,
    leadStageAtTimeOfFollowUp: prismaFollowUp.leadStageAtTimeOfFollowUp ?? undefined,
    comment: prismaFollowUp.comment ?? undefined,
    createdBy: prismaFollowUp.createdBy?.name ?? undefined,
    createdAt: prismaFollowUp.createdAt.toISOString(),
    followupOrTask: prismaFollowUp.followupOrTask,
    taskForUser: prismaFollowUp.taskForUser?.name ?? undefined,
    taskDate: prismaFollowUp.taskDate?.toISOString() ?? undefined,
    taskTime: prismaFollowUp.taskTime ?? undefined,
  };
}

export async function getDroppedLeads(): Promise<DroppedLead[]> {
    try {
        const droppedLeads = await prisma.droppedLead.findMany({
            orderBy: { droppedAt: 'desc' },
            include: { 
              followUps: { select: { id: true }},
              createdBy: true,
              assignedTo: true,
            }
        });
        return droppedLeads.map(mapPrismaDroppedLeadToDroppedLeadType);
    } catch (error) {
        console.error("Failed to fetch dropped leads:", error);
        return [];
    }
}

export async function getDroppedLeadById(id: string): Promise<DroppedLead | null> {
    if (!id) return null;
    try {
        const droppedLead = await prisma.droppedLead.findUnique({
            where: { id },
            include: { 
              followUps: true,
              createdBy: true,
              assignedTo: true,
            }
        });
        return droppedLead ? mapPrismaDroppedLeadToDroppedLeadType(droppedLead) : null;
    } catch (error) {
        console.error(`Failed to fetch dropped lead with id ${id}:`, error);
        return null;
    }
}

export async function getActivitiesForDroppedLead(droppedLeadId: string): Promise<FollowUp[]> {
    if (!droppedLeadId) return [];
    try {
      const activities = await prisma.followUp.findMany({
        where: { droppedLeadId },
        orderBy: { createdAt: 'desc' },
        include: { createdBy: true, taskForUser: true }
      });
      return activities.map(mapPrismaFollowUpToFollowUpType);
    } catch (error) {
      console.error(`Failed to fetch activities for dropped lead ${droppedLeadId}:`, error);
      return [];
    }
}

export async function reactivateLead(droppedLeadId: string): Promise<{ success: boolean; newLeadId?: string; message?: string }> {
    try {
        const droppedLead = await prisma.droppedLead.findUnique({
            where: { id: droppedLeadId },
            include: { followUps: true }
        });

        if (!droppedLead) {
            return { success: false, message: 'Dropped lead not found.' };
        }

        const newLead = await prisma.$transaction(async (tx) => {
            const createdLead = await tx.lead.create({
                data: {
                    name: droppedLead.name,
                    email: droppedLead.email,
                    phone: droppedLead.phone,
                    status: 'Follow-up' as LeadStatusType, // Default reactivated status
                    source: droppedLead.source,
                    createdAt: droppedLead.createdAt,
                    lastCommentText: `Reactivated: Lead was dropped with reason - ${droppedLead.dropReason}. ${droppedLead.dropComment || ''}`.trim(),
                    lastCommentDate: new Date(),
                    nextFollowUpDate: droppedLead.nextFollowUpDate,
                    nextFollowUpTime: droppedLead.nextFollowUpTime,
                    kilowatt: droppedLead.kilowatt,
                    address: droppedLead.address,
                    priority: droppedLead.priority,
                    clientType: droppedLead.clientType,
                    electricityBillUrl: droppedLead.electricityBillUrl,
                    dropReason: droppedLead.dropReason,
                    createdById: droppedLead.createdById,
                    assignedToId: droppedLead.assignedToId,
                }
            });

            if (droppedLead.followUps.length > 0) {
                await tx.followUp.updateMany({
                    where: { droppedLeadId: droppedLead.id },
                    data: {
                        leadId: createdLead.id,
                        droppedLeadId: null
                    }
                });
            }
            
            await tx.droppedLead.delete({
                where: { id: droppedLeadId }
            });

            return createdLead;
        });

        revalidatePath('/leads-list');
        revalidatePath('/dropped-leads-list');

        return { success: true, newLeadId: newLead.id };

    } catch (error) {
        console.error(`Failed to reactivate lead ${droppedLeadId}:`, error);
        return { success: false, message: 'An unexpected error occurred during reactivation.' };
    }
}


export async function bulkReactivateLeads(leadIds: string[]): Promise<{ success: boolean, count: number, message?: string }> {
    if (leadIds.length === 0) {
        return { success: false, count: 0, message: 'No leads selected.' };
    }
    
    let reactivatedCount = 0;
    try {
      for (const leadId of leadIds) {
        const result = await reactivateLead(leadId);
        if (result.success) {
          reactivatedCount++;
        }
      }
      
      revalidatePath('/leads-list');
      revalidatePath('/dropped-leads-list');
      
      return { success: true, count: reactivatedCount, message: `${reactivatedCount} leads reactivated successfully.` };
    } catch (error) {
        console.error(`Failed to reactivate leads:`, error);
        return { success: false, count: 0, message: 'An unexpected error occurred while reactivating leads.' };
    }
}
