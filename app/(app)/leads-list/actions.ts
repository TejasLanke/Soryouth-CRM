
'use server';

import prisma from '@/lib/prisma';
import type { Lead, FollowUp, AddActivityData, CreateLeadData, Client, DropReasonType, LeadSourceOptionType, UserOptionType, LeadStatusType } from '@/types';
import { revalidatePath } from 'next/cache';
import { format, parseISO } from 'date-fns';

// Helper function to map Prisma lead to frontend Lead type
function mapPrismaLeadToLeadType(prismaLead: any): Lead {
  return {
    id: prismaLead.id,
    name: prismaLead.name,
    status: prismaLead.status,
    createdAt: prismaLead.createdAt.toISOString(),
    updatedAt: prismaLead.updatedAt.toISOString(),
    email: prismaLead.email ?? undefined,
    phone: prismaLead.phone ?? undefined,
    source: prismaLead.source ?? undefined,
    assignedTo: prismaLead.assignedTo ?? undefined,
    createdBy: prismaLead.createdBy ?? undefined,
    lastCommentText: prismaLead.lastCommentText ?? undefined,
    lastCommentDate: prismaLead.lastCommentDate ? format(prismaLead.lastCommentDate, 'dd-MM-yyyy') : undefined,
    nextFollowUpDate: prismaLead.nextFollowUpDate ? format(prismaLead.nextFollowUpDate, 'yyyy-MM-dd') : undefined,
    nextFollowUpTime: prismaLead.nextFollowUpTime ?? undefined,
    kilowatt: prismaLead.kilowatt === null ? undefined : prismaLead.kilowatt,
    address: prismaLead.address ?? undefined,
    priority: prismaLead.priority ?? undefined,
    dropReason: prismaLead.dropReason ?? undefined,
    clientType: prismaLead.clientType ?? undefined,
    electricityBillUrl: prismaLead.electricityBillUrl ?? undefined,
    followupCount: prismaLead.followUps?.length ?? 0,
  } as Lead;
}

// Helper function to map Prisma FollowUp to frontend FollowUp type
function mapPrismaFollowUpToFollowUpType(prismaFollowUp: any): FollowUp {
  return {
    id: prismaFollowUp.id,
    leadId: prismaFollowUp.leadId ?? undefined,
    clientId: prismaFollowUp.clientId ?? undefined,
    type: prismaFollowUp.type,
    date: prismaFollowUp.date.toISOString(),
    time: prismaFollowUp.time ?? undefined,
    status: prismaFollowUp.status,
    leadStageAtTimeOfFollowUp: prismaFollowUp.leadStageAtTimeOfFollowUp ?? undefined,
    comment: prismaFollowUp.comment ?? undefined,
    createdBy: prismaFollowUp.createdBy ?? undefined,
    createdAt: prismaFollowUp.createdAt.toISOString(),
    followupOrTask: prismaFollowUp.followupOrTask,
    taskForUser: prismaFollowUp.taskForUser ?? undefined,
    taskDate: prismaFollowUp.taskDate?.toISOString() ?? undefined,
    taskTime: prismaFollowUp.taskTime ?? undefined,
  } as FollowUp;
}


export async function getLeads(): Promise<Lead[]> {
  try {
    const leadsFromDb = await prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        followUps: true
      }
    });
    return leadsFromDb.map(mapPrismaLeadToLeadType);
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return [];
  }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  if (!id) {
    console.warn("getLeadById called with no ID");
    return null;
  }
  try {
    const leadFromDb = await prisma.lead.findUnique({
      where: { id },
      include: { followUps: true }
    });

    if (!leadFromDb) {
      return null;
    }
    return mapPrismaLeadToLeadType(leadFromDb);
  } catch (error) {
    console.error(`Failed to fetch lead with id ${id}:`, error);
    return null;
  }
}

export async function createLead(data: CreateLeadData): Promise<Lead | null> {
  try {
    const newLead = await prisma.lead.create({
      data: {
        name: data.name,
        status: data.status,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
        assignedTo: data.assignedTo || null,
        createdBy: data.createdBy || 'System', // Default createdBy
        lastCommentText: data.lastCommentText || null,
        lastCommentDate: data.lastCommentDate ? parseISO(data.lastCommentDate.split('-').reverse().join('-')) : null,
        nextFollowUpDate: data.nextFollowUpDate ? parseISO(data.nextFollowUpDate) : null,
        nextFollowUpTime: data.nextFollowUpTime || null,
        kilowatt: data.kilowatt === undefined ? null : Number(data.kilowatt),
        address: data.address || null,
        priority: data.priority || null,
        dropReason: data.dropReason || null,
        clientType: data.clientType || null,
        electricityBillUrl: data.electricityBillUrl || null,
      },
    });
    revalidatePath('/leads-list');
    return mapPrismaLeadToLeadType(newLead);
  } catch (error) {
    console.error("Failed to create lead:", error);
    return null;
  }
}

export async function updateLead(id: string, data: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followupCount'>>): Promise<Lead | null> {
  try {
    const prismaData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const typedKey = key as keyof Partial<Lead>;
        if (['id', 'createdAt', 'updatedAt', 'followupCount'].includes(typedKey)) continue;

        if (typedKey === 'kilowatt') {
          prismaData[typedKey] = data[typedKey] === undefined || data[typedKey] === null ? null : Number(data[typedKey]);
        } else if (typedKey === 'nextFollowUpDate' && data.nextFollowUpDate) {
           prismaData[typedKey] = parseISO(data.nextFollowUpDate);
        } else if (typedKey === 'lastCommentDate' && data.lastCommentDate) {
           prismaData[typedKey] = parseISO(data.lastCommentDate.split('-').reverse().join('-'));
        }
        else {
          (prismaData as any)[typedKey] = (data as any)[typedKey] || null;
        }
      }
    }

    const updatedLeadFromDb = await prisma.lead.update({
      where: { id },
      data: prismaData,
    });
    
    revalidatePath('/leads-list');
    revalidatePath(`/leads/${id}`);
    revalidatePath('/clients-list');
    revalidatePath(`/clients/${id}`);


    return mapPrismaLeadToLeadType(updatedLeadFromDb);
  } catch (error) {
    console.error("Failed to update lead:", error);
    return null;
  }
}

export async function deleteLead(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.lead.delete({
      where: { id },
    });
    revalidatePath('/leads-list');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return { success: false };
  }
}

export async function getActivitiesForLead(leadId: string): Promise<FollowUp[]> {
  if (!leadId) return [];
  try {
    const activities = await prisma.followUp.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
    return activities.map(mapPrismaFollowUpToFollowUpType);
  } catch (error) {
    console.error(`Failed to fetch activities for lead ${leadId}:`, error);
    return [];
  }
}

export async function addActivity(
  data: AddActivityData
): Promise<FollowUp | null> {
  if (!data.leadId) {
    console.error("addActivity requires a leadId");
    return null;
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const newActivity = await tx.followUp.create({
        data: {
          leadId: data.leadId,
          type: data.type,
          date: parseISO(data.date),
          time: data.time || null,
          status: data.status,
          leadStageAtTimeOfFollowUp: data.leadStageAtTimeOfFollowUp || null,
          comment: data.comment || null,
          createdBy: data.createdBy || 'System',
          followupOrTask: data.followupOrTask,
          taskForUser: data.taskForUser || null,
          taskDate: data.taskDate ? parseISO(data.taskDate) : null,
          taskTime: data.taskTime || null,
        },
      });

      const leadUpdateData: any = {
        lastCommentText: data.comment,
        lastCommentDate: parseISO(data.date),
      };

      if (data.leadStageAtTimeOfFollowUp) {
        leadUpdateData.status = data.leadStageAtTimeOfFollowUp;
      }
      
      if (data.priority) {
        leadUpdateData.priority = data.priority;
      }
      
      if (data.taskDate && data.taskTime) {
        const activityDateTime = new Date(`${data.taskDate}T${data.taskTime || '00:00:00'}`);
        if (activityDateTime > new Date()) {
           leadUpdateData.nextFollowUpDate = parseISO(data.taskDate);
           leadUpdateData.nextFollowUpTime = data.taskTime;
        }
      }

      await tx.lead.update({
        where: { id: data.leadId! },
        data: leadUpdateData,
      });

      return newActivity;
    });

    revalidatePath(`/leads/${data.leadId}`);
    return mapPrismaFollowUpToFollowUpType(result);
  } catch (error) {
    console.error('Failed to add activity:', error);
    return null;
  }
}


export async function convertToClient(leadId: string): Promise<{ success: boolean; clientId?: string; message?: string }> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { followUps: true },
    });

    if (!lead) {
      return { success: false, message: 'Lead not found.' };
    }

    const newClient = await prisma.$transaction(async (tx) => {
      // 1. Create a new client from the lead data
      const createdClient = await tx.client.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: 'Fresher',
          priority: 'Average',
          assignedTo: lead.assignedTo,
          createdBy: lead.createdBy,
          createdAt: lead.createdAt, // Preserve original creation date from the lead
          kilowatt: lead.kilowatt,
          address: lead.address,
          clientType: lead.clientType,
          electricityBillUrl: lead.electricityBillUrl,
        },
      });

      // 2. Re-associate all follow-ups with the new client
      if (lead.followUps.length > 0) {
        await tx.followUp.updateMany({
          where: { leadId: lead.id },
          data: {
            clientId: createdClient.id,
            leadId: null, // Disassociate from the lead
          },
        });
      }

      // 3. Delete the original lead
      await tx.lead.delete({
        where: { id: lead.id },
      });

      return createdClient;
    });

    revalidatePath('/leads-list');
    revalidatePath('/clients-list');

    return { success: true, clientId: newClient.id };
  } catch (error) {
    console.error(`Failed to convert lead ${leadId} to client:`, error);
    return { success: false, message: 'An unexpected error occurred during conversion.' };
  }
}

export async function dropLead(leadId: string, dropReason: DropReasonType, dropComment?: string): Promise<{ success: boolean, droppedLeadId?: string, message?: string }> {
    try {
        const leadToDrop = await prisma.lead.findUnique({
            where: { id: leadId },
            include: { followUps: true }
        });

        if (!leadToDrop) {
            return { success: false, message: "Lead not found." };
        }

        const newDroppedLead = await prisma.$transaction(async (tx) => {
            const createdDroppedLead = await tx.droppedLead.create({
                data: {
                    name: leadToDrop.name,
                    email: leadToDrop.email,
                    phone: leadToDrop.phone,
                    status: 'Lost',
                    source: leadToDrop.source,
                    assignedTo: leadToDrop.assignedTo,
                    createdBy: leadToDrop.createdBy,
                    createdAt: leadToDrop.createdAt,
                    updatedAt: leadToDrop.updatedAt,
                    lastCommentText: leadToDrop.lastCommentText,
                    lastCommentDate: leadToDrop.lastCommentDate,
                    nextFollowUpDate: leadToDrop.nextFollowUpDate,
                    nextFollowUpTime: leadToDrop.nextFollowUpTime,
                    kilowatt: leadToDrop.kilowatt,
                    address: leadToDrop.address,
                    priority: leadToDrop.priority,
                    clientType: leadToDrop.clientType,
                    electricityBillUrl: leadToDrop.electricityBillUrl,
                    dropReason: dropReason,
                    dropComment: dropComment,
                }
            });
            
            if (leadToDrop.followUps.length > 0) {
                await tx.followUp.updateMany({
                    where: { leadId: leadToDrop.id },
                    data: {
                        droppedLeadId: createdDroppedLead.id,
                        leadId: null,
                    }
                });
            }

            await tx.lead.delete({
                where: { id: leadId }
            });

            return createdDroppedLead;
        });

        revalidatePath('/leads-list');
        revalidatePath('/dropped-leads-list');
        return { success: true, droppedLeadId: newDroppedLead.id };

    } catch (error) {
        console.error(`Failed to drop lead ${leadId}:`, error);
        return { success: false, message: "An unexpected error occurred while dropping the lead." };
    }
}

export async function bulkUpdateLeads(
  leadIds: string[],
  data: Partial<Pick<Lead, 'status' | 'source' | 'assignedTo'>>
): Promise<{ success: boolean; count: number; message?: string }> {
  if (leadIds.length === 0) {
    return { success: false, count: 0, message: 'No leads selected.' };
  }
  try {
    const result = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
      },
      data,
    });
    revalidatePath('/leads-list');
    return { success: true, count: result.count };
  } catch (error) {
    console.error('Failed to bulk update leads:', error);
    return { success: false, count: 0, message: 'An unexpected error occurred during bulk update.' };
  }
}

export async function bulkDropLeads(leadIds: string[], dropReason: DropReasonType, dropComment?: string): Promise<{ success: boolean, count: number, message?: string }> {
    if (leadIds.length === 0) {
        return { success: false, count: 0, message: 'No leads selected.' };
    }
    
    let droppedCount = 0;
    try {
      for (const leadId of leadIds) {
        // Reusing the single dropLead logic in a loop
        const result = await dropLead(leadId, dropReason, dropComment);
        if (result.success) {
          droppedCount++;
        }
      }
      
      // Revalidation is already handled inside dropLead, but an extra one here doesn't hurt.
      revalidatePath('/leads-list');
      revalidatePath('/dropped-leads-list');
      
      return { success: true, count: droppedCount, message: `${droppedCount} leads dropped successfully.` };
    } catch (error) {
        console.error(`Failed to drop leads:`, error);
        return { success: false, count: 0, message: 'An unexpected error occurred while dropping leads.' };
    }
}
