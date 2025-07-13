
'use server';

import prisma from '@/lib/prisma';
import type { Deal, DealPipelineType, DealStage, User, LeadSourceOptionType, FollowUp, AddActivityData } from '@/types';
import { revalidatePath } from 'next/cache';
import { format, parseISO } from 'date-fns';
import { verifySession } from '@/lib/auth';
import type { Prisma, PrismaClient } from '@prisma/client';
import { DEAL_PIPELINES } from '@/lib/constants';

function mapPrismaDeal(deal: any): Deal {
    return {
        ...deal,
        dealValue: Number(deal.dealValue),
        poWoDate: deal.poWoDate.toISOString(),
        createdAt: deal.createdAt.toISOString(),
        updatedAt: deal.updatedAt.toISOString(),
        assignedTo: deal.assignedTo?.name,
        clientId: deal.clientId ?? undefined,
        clientName: deal.client?.name ?? deal.clientName,
    };
}

// Helper function to map Prisma FollowUp to frontend FollowUp type
function mapPrismaFollowUpToFollowUpType(prismaFollowUp: any): FollowUp {
  return {
    id: prismaFollowUp.id,
    leadId: prismaFollowUp.leadId ?? undefined,
    clientId: prismaFollowUp.clientId ?? undefined,
    dealId: prismaFollowUp.dealId ?? undefined,
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
  } as FollowUp;
}

async function updateTotalDealValueForClient(clientId: string, tx: Prisma.TransactionClient | PrismaClient) {
    const allDealsForClient = await tx.deal.findMany({
        where: { clientId: clientId },
        select: { dealValue: true }
    });

    const totalDealValue = allDealsForClient.reduce((sum, deal) => sum + Number(deal.dealValue), 0);
    
    await tx.client.update({
        where: { id: clientId },
        data: { totalDealValue: totalDealValue }
    });
}

export async function createOrUpdateDeal(data: Partial<Deal>): Promise<Deal | null> {
    const session = await verifySession();
    if (!session?.userId) {
        console.error("Authentication error: No user session found.");
        return null;
    }

    try {
        const savedDeal = await prisma.$transaction(async (tx) => {
            let assignedToId: string | undefined;
            if (data.assignedTo) {
                const user = await tx.user.findFirst({ where: { name: data.assignedTo }});
                assignedToId = user?.id;
            }

            let finalClientName = data.clientName;
            if (!finalClientName && data.clientId) {
                const client = await tx.client.findUnique({ where: { id: data.clientId }, select: { name: true }});
                finalClientName = client?.name;
            }
            
            const dataToSave = {
                clientName: finalClientName || 'Unnamed Deal',
                contactPerson: data.contactPerson || '',
                email: data.email,
                phone: data.phone,
                pipeline: data.pipeline || 'Solar PV Plant',
                dealFor: data.dealFor,
                source: data.source,
                stage: data.stage || DEAL_PIPELINES['Solar PV Plant'][0],
                dealValue: data.dealValue || 0,
                poWoDate: data.poWoDate ? parseISO(data.poWoDate as string) : new Date(),
            };

            const relationalData = {
                client: data.clientId ? { connect: { id: data.clientId } } : undefined,
                assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined,
            };

            let resultDeal;
            if (data.id) {
                resultDeal = await tx.deal.update({
                    where: { id: data.id },
                    data: {
                        ...dataToSave,
                        ...relationalData,
                    },
                    include: { client: true, assignedTo: true }
                });
            } else {
                 resultDeal = await tx.deal.create({
                    data: {
                        ...dataToSave,
                        createdBy: { connect: { id: session.userId! } },
                        ...relationalData,
                    },
                    include: { client: true, assignedTo: true }
                });
            }

            if(resultDeal.clientId) {
                await updateTotalDealValueForClient(resultDeal.clientId, tx);
            }

            return resultDeal;
        });

        if (savedDeal.clientId) {
            revalidatePath(`/clients/${savedDeal.clientId}`);
        }
        revalidatePath('/deals');

        return mapPrismaDeal(savedDeal);
    } catch (error) {
        console.error("Failed to create or update deal:", error);
        return null;
    }
}

export async function getDealsForClient(clientId: string): Promise<Deal[]> {
    if (!clientId) return [];
    try {
        const deals = await prisma.deal.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
            include: { assignedTo: true, client: true }
        });
        return deals.map(mapPrismaDeal);
    } catch (error) {
        console.error(`Failed to fetch deals for client ${clientId}:`, error);
        return [];
    }
}

export async function getAllDeals(): Promise<Deal[]> {
     try {
        const deals = await prisma.deal.findMany({
            orderBy: { createdAt: 'desc' },
            include: { assignedTo: true, client: true }
        });
        return deals.map(mapPrismaDeal);
    } catch (error) {
        console.error("Failed to fetch all deals:", error);
        return [];
    }
}

export async function updateDealStage(dealId: string, newStage: DealStage): Promise<Deal | null> {
    try {
        const updatedDeal = await prisma.deal.update({
            where: { id: dealId },
            data: { stage: newStage },
            include: { assignedTo: true, client: true }
        });
        revalidatePath('/deals');
        return mapPrismaDeal(updatedDeal);
    } catch (error) {
        console.error(`Failed to update stage for deal ${dealId}:`, error);
        return null;
    }
}

export async function getDealById(id: string): Promise<Deal | null> {
  if (!id) return null;
  try {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { assignedTo: true, client: true, createdBy: true }
    });
    return deal ? mapPrismaDeal(deal) : null;
  } catch (error) {
    console.error(`Failed to fetch deal with id ${id}:`, error);
    return null;
  }
}

export async function getActivitiesForDeal(dealId: string): Promise<FollowUp[]> {
  if (!dealId) return [];
  try {
    const activities = await prisma.followUp.findMany({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: true, taskForUser: true }
    });
    return activities.map(mapPrismaFollowUpToFollowUpType);
  } catch (error) {
    console.error(`Failed to fetch activities for deal ${dealId}:`, error);
    return [];
  }
}

export async function addDealActivity(data: AddActivityData): Promise<FollowUp | null> {
  if (!data.dealId) {
    console.error("addDealActivity requires a dealId");
    return null;
  }
  const session = await verifySession();
  if (!session?.userId) {
    console.error("User must be logged in to add activity.");
    return null;
  }

  try {
    let taskForUserId: string | null = null;
    if (data.taskForUser) {
        const user = await prisma.user.findFirst({ where: { name: data.taskForUser }});
        if (user) taskForUserId = user.id;
    }

    const newActivity = await prisma.followUp.create({
        data: {
          dealId: data.dealId,
          type: data.type,
          date: parseISO(data.date),
          time: data.time || null,
          status: data.status,
          leadStageAtTimeOfFollowUp: data.leadStageAtTimeOfFollowUp || null,
          comment: data.comment || null,
          followupOrTask: data.followupOrTask,
          taskDate: data.taskDate ? parseISO(data.taskDate) : null,
          taskTime: data.taskTime || null,
          createdById: session.userId,
          taskForUserId: taskForUserId,
        },
        include: { createdBy: true, taskForUser: true }
    });

    revalidatePath(`/deals/${data.dealId}`);

    return newActivity ? mapPrismaFollowUpToFollowUpType(newActivity) : null;
  } catch (error) {
    console.error('Failed to add deal activity:', error);
    return null;
  }
}
