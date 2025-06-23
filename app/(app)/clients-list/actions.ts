
'use server';

import prisma from '@/lib/prisma';
import type { Client, FollowUp, AddActivityData, CreateClientData, LeadStatusType } from '@/types';
import { revalidatePath } from 'next/cache';
import { format, parseISO } from 'date-fns';

// Helper to map Prisma client to frontend Client type
function mapPrismaClientToClientType(prismaClient: any): Client {
  return {
    id: prismaClient.id,
    name: prismaClient.name,
    email: prismaClient.email ?? undefined,
    phone: prismaClient.phone ?? undefined,
    status: prismaClient.status,
    priority: prismaClient.priority ?? undefined,
    assignedTo: prismaClient.assignedTo ?? undefined,
    createdBy: prismaClient.createdBy ?? undefined,
    createdAt: prismaClient.createdAt.toISOString(),
    updatedAt: prismaClient.updatedAt.toISOString(),
    kilowatt: prismaClient.kilowatt ?? undefined,
    address: prismaClient.address ?? undefined,
    clientType: prismaClient.clientType ?? undefined,
    electricityBillUrl: prismaClient.electricityBillUrl ?? undefined,
    followUpCount: prismaClient.followUps?.length ?? 0,
    lastCommentText: prismaClient.followUps?.[0]?.comment ?? undefined,
    lastCommentDate: prismaClient.followUps?.[0]?.createdAt ? format(prismaClient.followUps[0].createdAt, 'dd-MM-yyyy') : undefined,
    nextFollowUpDate: prismaClient.nextFollowUpDate ? format(prismaClient.nextFollowUpDate, 'yyyy-MM-dd') : undefined,
    nextFollowUpTime: prismaClient.nextFollowUpTime ?? undefined,
  };
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

export async function getClients(): Promise<Client[]> {
  try {
    const clientsFromDb = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    return clientsFromDb.map(mapPrismaClientToClientType);
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return [];
  }
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!id) return null;
  try {
    const clientFromDb = await prisma.client.findUnique({
      where: { id },
      include: { followUps: {
        orderBy: { createdAt: 'desc' }
      } }
    });
    if (!clientFromDb) return null;
    return mapPrismaClientToClientType(clientFromDb);
  } catch (error) {
    console.error(`Failed to fetch client with id ${id}:`, error);
    return null;
  }
}

export async function createClient(data: CreateClientData): Promise<Client | null> {
    try {
        const newClient = await prisma.client.create({
            data: {
                name: data.name,
                status: data.status,
                email: data.email || null,
                phone: data.phone || null,
                assignedTo: data.assignedTo || null,
                createdBy: data.createdBy || 'System',
                kilowatt: data.kilowatt === undefined ? null : Number(data.kilowatt),
                address: data.address || null,
                priority: data.priority || null,
                clientType: data.clientType || null,
                electricityBillUrl: data.electricityBillUrl || null,
            }
        });
        revalidatePath('/clients-list');
        return mapPrismaClientToClientType(newClient);
    } catch (error) {
        console.error("Failed to create client:", error);
        return null;
    }
}

export async function updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'followUpCount'>>): Promise<Client | null> {
    try {
        const prismaData: any = {};
        const fieldsToIgnore = ['id', 'createdAt', 'updatedAt', 'followUpCount', 'lastCommentText', 'lastCommentDate', 'nextFollowUpDate', 'nextFollowUpTime'];
        
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                if (fieldsToIgnore.includes(key)) {
                    continue;
                }

                const typedKey = key as keyof typeof data;
                if (typedKey === 'kilowatt') {
                    prismaData.kilowatt = data.kilowatt === undefined ? null : Number(data.kilowatt);
                } else {
                    prismaData[typedKey] = (data as any)[typedKey] ?? null;
                }
            }
        }

        const updatedClientFromDb = await prisma.client.update({
            where: { id },
            data: prismaData
        });

        revalidatePath('/clients-list');
        revalidatePath(`/clients/${id}`);
        return mapPrismaClientToClientType(updatedClientFromDb);
    } catch (error) {
        console.error("Failed to update client:", error);
        return null;
    }
}


export async function deleteClient(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.client.delete({ where: { id } });
    revalidatePath('/clients-list');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete client:", error);
    return { success: false };
  }
}


export async function getActivitiesForClient(clientId: string): Promise<FollowUp[]> {
  if (!clientId) return [];
  try {
    const activities = await prisma.followUp.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
    return activities.map(mapPrismaFollowUpToFollowUpType);
  } catch (error) {
    console.error(`Failed to fetch activities for client ${clientId}:`, error);
    return [];
  }
}

export async function addClientActivity(data: AddActivityData): Promise<FollowUp | null> {
  if (!data.clientId) {
    console.error("addClientActivity requires a clientId");
    return null;
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const newActivity = await tx.followUp.create({
        data: {
          clientId: data.clientId,
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

      const clientUpdateData: any = {
        lastCommentText: data.comment,
        lastCommentDate: parseISO(data.date),
      };
      
      if (data.leadStageAtTimeOfFollowUp) {
        clientUpdateData.status = data.leadStageAtTimeOfFollowUp;
      }
      if (data.priority) {
        clientUpdateData.priority = data.priority;
      }

      if (data.taskDate && data.taskTime) {
        const activityDateTime = new Date(`${data.taskDate}T${data.taskTime || '00:00:00'}`);
        if (activityDateTime > new Date()) {
           clientUpdateData.nextFollowUpDate = parseISO(data.taskDate);
           clientUpdateData.nextFollowUpTime = data.taskTime;
        }
      }
      
      await tx.client.update({
        where: { id: data.clientId! },
        data: clientUpdateData,
      });

      return newActivity;
    });

    revalidatePath(`/clients/${data.clientId}`);
    return mapPrismaFollowUpToFollowUpType(result);
  } catch (error) {
    console.error('Failed to add client activity:', error);
    return null;
  }
}

export async function convertClientToLead(clientId: string): Promise<{ success: boolean; leadId?: string; message?: string }> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { followUps: { orderBy: { createdAt: 'desc' }} },
    });

    if (!client) {
      return { success: false, message: 'Client not found.' };
    }

    let leadStatus: LeadStatusType = 'Follow-up'; // Default
    if (client.status === 'On Hold') {
        leadStatus = 'On Hold';
    } else if (client.status === 'Fresher') {
        leadStatus = 'Fresher';
    }

    const newLead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          name: client.name,
          email: client.email,
          phone: client.phone,
          status: leadStatus,
          priority: 'Average', 
          source: 'Other', 
          assignedTo: client.assignedTo,
          createdBy: client.createdBy,
          createdAt: client.createdAt,
          kilowatt: client.kilowatt,
          address: client.address,
          clientType: client.clientType,
          electricityBillUrl: client.electricityBillUrl,
          nextFollowUpDate: client.nextFollowUpDate,
          nextFollowUpTime: client.nextFollowUpTime,
          lastCommentText: client.followUps[0]?.comment ?? null,
          lastCommentDate: client.followUps[0]?.createdAt ?? null,
        },
      });

      if (client.followUps.length > 0) {
        await tx.followUp.updateMany({
          where: { clientId: client.id },
          data: {
            leadId: createdLead.id,
            clientId: null,
          },
        });
      }

      await tx.client.delete({
        where: { id: client.id },
      });

      return createdLead;
    });

    revalidatePath('/leads-list');
    revalidatePath('/clients-list');
    revalidatePath(`/clients/${clientId}`);

    return { success: true, leadId: newLead.id };
  } catch (error) {
    console.error(`Failed to convert client ${clientId} to lead:`, error);
    return { success: false, message: 'An unexpected error occurred during conversion.' };
  }
}
