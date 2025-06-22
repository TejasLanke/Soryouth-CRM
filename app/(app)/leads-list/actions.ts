
'use server';

import prisma from '@/lib/prisma';
import type { Lead, FollowUp, AddActivityData } from '@/types';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

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
    followUpCount: prismaLead.followUpCount ?? 0,
  } as Lead;
}

// Helper function to map Prisma FollowUp to frontend FollowUp type
function mapPrismaFollowUpToFollowUpType(prismaFollowUp: any): FollowUp {
  return {
    id: prismaFollowUp.id,
    leadId: prismaFollowUp.leadId,
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

export async function createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpCount'>): Promise<Lead | null> {
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
        lastCommentDate: data.lastCommentDate ? new Date(data.lastCommentDate.split('-').reverse().join('-')) : null,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
        nextFollowUpTime: data.nextFollowUpTime || null,
        kilowatt: data.kilowatt === undefined ? null : Number(data.kilowatt),
        address: data.address || null,
        priority: data.priority || null,
        dropReason: data.dropReason || null,
        clientType: data.clientType || null,
        electricityBillUrl: data.electricityBillUrl || null,
        followUpCount: 0, // Initialize count
      },
    });
    revalidatePath('/leads-list');
    return mapPrismaLeadToLeadType(newLead);
  } catch (error) {
    console.error("Failed to create lead:", error);
    return null;
  }
}

export async function updateLead(id: string, data: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Lead | null> {
  try {
    const prismaData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const typedKey = key as keyof Partial<Lead>;
        // Skip keys that are handled by relations or Prisma's defaults
        if (['id', 'createdAt', 'updatedAt'].includes(typedKey)) continue;

        if (typedKey === 'kilowatt') {
          prismaData[typedKey] = data[typedKey] === undefined || data[typedKey] === null ? null : Number(data[typedKey]);
        } else if (typedKey === 'nextFollowUpDate' && data.nextFollowUpDate) {
           prismaData[typedKey] = new Date(data.nextFollowUpDate);
        } else if (typedKey === 'lastCommentDate' && data.lastCommentDate) {
           prismaData[typedKey] = new Date(data.lastCommentDate.split('-').reverse().join('-'));
        }
        else {
          // Use `undefined` to skip updating a field, and `null` to set it to null in the DB.
          // This ensures that if a field is not in the `data` object, it's not changed.
          // The `|| null` ensures empty strings from forms become null in the db.
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
    revalidatePath(`/leads/${id}`);
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
  try {
    const result = await prisma.$transaction(async (tx) => {
      const newActivity = await tx.followUp.create({
        data: {
          leadId: data.leadId,
          type: data.type,
          date: new Date(data.date),
          time: data.time || null,
          status: data.status,
          leadStageAtTimeOfFollowUp: data.leadStageAtTimeOfFollowUp || null,
          comment: data.comment || null,
          createdBy: data.createdBy || 'System',
          followupOrTask: data.followupOrTask,
          taskForUser: data.taskForUser || null,
          taskDate: data.taskDate ? new Date(data.taskDate) : null,
          taskTime: data.taskTime || null,
        },
      });

      const leadUpdateData: any = {
        followUpCount: { increment: 1 },
        lastCommentText: data.comment,
        lastCommentDate: new Date(data.date),
      };

      if (data.leadStageAtTimeOfFollowUp) {
        leadUpdateData.status = data.leadStageAtTimeOfFollowUp;
      }
      
      if (data.priority) {
        leadUpdateData.priority = data.priority;
      }
      
      const activityDateTime = new Date(`${data.date}T${data.time || '00:00:00'}`);
      if (activityDateTime > new Date()) {
         leadUpdateData.nextFollowUpDate = new Date(data.date);
         leadUpdateData.nextFollowUpTime = data.time;
      }

      await tx.lead.update({
        where: { id: data.leadId },
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
