'use server';

import prisma from '@/lib/prisma';
import type { Lead, FollowUp, AddActivityData, CreateLeadData, Client, DropReasonType, LeadSourceOptionType, UserOptionType, LeadStatusType } from '@/types';
import { revalidatePath } from 'next/cache';
import { format, parseISO } from 'date-fns';
import { verifySession } from '@/lib/auth';
import * as ExcelJS from 'exceljs';
import { z } from 'zod';

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
    assignedTo: prismaLead.assignedTo?.name ?? undefined,
    createdBy: prismaLead.createdBy?.name ?? undefined,
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
    createdBy: prismaFollowUp.createdBy?.name ?? undefined,
    createdAt: prismaFollowUp.createdAt.toISOString(),
    followupOrTask: prismaFollowUp.followupOrTask,
    taskForUser: prismaFollowUp.taskForUser?.name ?? undefined,
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
        followUps: {
          select: { id: true } // Only select ID to count them
        },
        createdBy: true,
        assignedTo: true,
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
      include: { 
        followUps: true,
        createdBy: true,
        assignedTo: true,
      }
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
  const session = await verifySession();
  if (!session?.userId) {
      console.error("Authentication error: No user session found.");
      return null;
  }
  
  try {
    let assignedToId: string | null = null;
    if (data.assignedTo) {
      const user = await prisma.user.findFirst({ where: { name: data.assignedTo }});
      if (user) assignedToId = user.id;
    }
    
    const newLead = await prisma.lead.create({
      data: {
        name: data.name,
        status: data.status,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
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
        createdById: session.userId,
        assignedToId: assignedToId,
      },
    });
    revalidatePath('/leads-list');
    const newLeadWithRelations = await getLeadById(newLead.id);
    return newLeadWithRelations;
  } catch (error) {
    console.error("Failed to create lead:", error);
    return null;
  }
}

export async function updateLead(id: string, data: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followupCount'>>): Promise<Lead | null> {
  try {
    const prismaData: any = {};
    const fieldsToIgnore = ['id', 'createdAt', 'updatedAt', 'followupCount', 'createdBy', 'assignedTo'];

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
         if (fieldsToIgnore.includes(key)) continue;

        const typedKey = key as keyof typeof data;
        
        if (typedKey === 'kilowatt') {
            prismaData.kilowatt = data.kilowatt === undefined ? null : Number(data.kilowatt);
        } else if (typedKey === 'nextFollowUpDate' && data.nextFollowUpDate) {
           prismaData[typedKey] = parseISO(data.nextFollowUpDate);
        } else if (typedKey === 'lastCommentDate' && data.lastCommentDate) {
           prismaData[typedKey] = parseISO(data.lastCommentDate.split('-').reverse().join('-'));
        }
        else {
          (prismaData as any)[typedKey] = (data as any)[typedKey] ?? null;
        }
      }
    }

    if (data.assignedTo) {
        const user = await prisma.user.findFirst({ where: { name: data.assignedTo }});
        prismaData.assignedToId = user ? user.id : null;
    }

    const updatedLeadFromDb = await prisma.lead.update({
      where: { id },
      data: prismaData,
      include: { createdBy: true, assignedTo: true, followUps: { select: { id: true } } }
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
      include: { createdBy: true, taskForUser: true }
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
          followupOrTask: data.followupOrTask,
          taskDate: data.taskDate ? parseISO(data.taskDate) : null,
          taskTime: data.taskTime || null,
          createdById: session.userId,
          taskForUserId: taskForUserId,
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
    
    // Fetch the newly created activity with its relations to return full data
    const newActivityWithRelations = await prisma.followUp.findUnique({
      where: { id: result.id },
      include: { createdBy: true, taskForUser: true }
    });
    
    return newActivityWithRelations ? mapPrismaFollowUpToFollowUpType(newActivityWithRelations) : null;
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
          createdAt: lead.createdAt,
          kilowatt: lead.kilowatt,
          address: lead.address,
          clientType: lead.clientType,
          electricityBillUrl: lead.electricityBillUrl,
          createdById: lead.createdById,
          assignedToId: lead.assignedToId,
          lastCommentText: lead.lastCommentText,
          lastCommentDate: lead.lastCommentDate,
          nextFollowUpDate: lead.nextFollowUpDate,
          nextFollowUpTime: lead.nextFollowUpTime,
        },
      });

      // 2. Re-associate all follow-ups with the new client
      if (lead.followUps.length > 0) {
        await tx.followUp.updateMany({
          where: { leadId: lead.id },
          data: {
            clientId: createdClient.id,
            leadId: null,
          },
        });
      }

      // 3. Re-associate all proposals with the new client
      await tx.proposal.updateMany({
        where: { leadId: lead.id },
        data: {
          clientId: createdClient.id,
          leadId: null,
        },
      });

      // 4. Delete the original lead
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
            include: { followUps: true, proposals: true, siteSurveys: true }
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
                    createdById: leadToDrop.createdById,
                    assignedToId: leadToDrop.assignedToId,
                }
            });
            
            await tx.followUp.updateMany({
                where: { leadId: leadToDrop.id },
                data: {
                    droppedLeadId: createdDroppedLead.id,
                    leadId: null,
                }
            });
            
            if (leadToDrop.proposals.length > 0) {
              await tx.proposal.updateMany({
                where: { leadId: leadToDrop.id },
                data: {
                  droppedLeadId: createdDroppedLead.id,
                  leadId: null,
                },
              });
            }
            
            if (leadToDrop.siteSurveys.length > 0) {
              await tx.siteSurvey.updateMany({
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
  
  const updateData: any = {};
  if (data.status) updateData.status = data.status;
  if (data.source) updateData.source = data.source;
  
  if (data.assignedTo) {
      const user = await prisma.user.findFirst({ where: { name: data.assignedTo }});
      if (user) {
          updateData.assignedToId = user.id;
      } else {
          return { success: false, count: 0, message: `User '${data.assignedTo}' not found.`};
      }
  }

  try {
    const result = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
      },
      data: updateData,
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
        const result = await dropLead(leadId, dropReason, dropComment);
        if (result.success) {
          droppedCount++;
        }
      }
      
      revalidatePath('/leads-list');
      revalidatePath('/dropped-leads-list');
      
      return { success: true, count: droppedCount, message: `${droppedCount} leads dropped successfully.` };
    } catch (error) {
        console.error(`Failed to drop leads:`, error);
        return { success: false, count: 0, message: 'An unexpected error occurred while dropping leads.' };
    }
}

const leadImportSchema = z.object({
  Name: z.string().min(2),
  Email: z.string().email().optional().or(z.literal('')),
  Phone: z.string().optional().or(z.literal('')),
  Status: z.string().optional().or(z.literal('')),
  Source: z.string().optional().or(z.literal('')),
  'Assigned To': z.string().optional().or(z.literal('')),
  Kilowatt: z.coerce.number().optional(),
  Address: z.string().optional().or(z.literal('')),
  Priority: z.string().optional().or(z.literal('')),
  'Customer Type': z.string().optional().or(z.literal('')),
});

export async function importLeads(formData: FormData): Promise<{ success: boolean; message: string; createdCount: number, errorCount: number }> {
    const session = await verifySession();
    if (!session?.userId) {
        return { success: false, message: 'Authentication required.', createdCount: 0, errorCount: 0 };
    }

    const file = formData.get('file') as File;
    if (!file) {
        return { success: false, message: 'No file uploaded.', createdCount: 0, errorCount: 0 };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
             return { success: false, message: 'No worksheet found in the file.', createdCount: 0, errorCount: 0 };
        }

        const data: any[] = [];
        const headerRow = worksheet.getRow(1);
        
        if (headerRow.actualCellCount === 0) {
            return { success: false, message: 'The Excel file is empty or has an empty header row.', createdCount: 0, errorCount: 0 };
        }

        const headers: string[] = [];
        headerRow.eachCell({ includeEmpty: false }, (cell) => {
            headers.push(cell.text?.toString().trim() ?? '');
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                const rowObject: any = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const header = headers[colNumber - 1];
                    if (header) {
                        rowObject[header] = cell.text;
                    }
                });
                if (Object.values(rowObject).some(val => val !== null && val !== '')) {
                    data.push(rowObject);
                }
            }
        });

        const users = await prisma.user.findMany();
        const userMap = new Map(users.map(u => [u.name.toLowerCase(), u.id]));

        const leadsToCreate = [];
        let errorCount = 0;

        for (const row of data) {
            const validation = leadImportSchema.safeParse(row);
            if (!validation.success) {
                errorCount++;
                continue;
            }

            const { data: validRow } = validation;
            
            let assignedToId: string | undefined = undefined;
            if (validRow['Assigned To']) {
                assignedToId = userMap.get(validRow['Assigned To'].toLowerCase());
            }

            const leadData = {
                name: validRow.Name,
                email: validRow.Email || null,
                phone: String(validRow.Phone || ''),
                status: validRow.Status || 'Fresher',
                source: validRow.Source || 'Other',
                kilowatt: validRow.Kilowatt || null,
                address: validRow.Address || null,
                priority: validRow.Priority || 'Average',
                clientType: validRow['Customer Type'] || 'Other',
                createdById: session.userId,
                assignedToId: assignedToId || null,
            };
            leadsToCreate.push(leadData);
        }

        if (leadsToCreate.length > 0) {
            await prisma.lead.createMany({
                data: leadsToCreate,
                skipDuplicates: true,
            });
        }
        
        revalidatePath('/leads-list');
        
        const message = `Import complete. ${leadsToCreate.length} leads successfully imported. ${errorCount > 0 ? `${errorCount} rows had errors and were skipped.` : ''}`;
        return { success: true, message, createdCount: leadsToCreate.length, errorCount };

    } catch (error) {
        console.error("Failed to import leads:", error);
        return { success: false, message: 'An unexpected error occurred during import.', createdCount: 0, errorCount: 0 };
    }
}