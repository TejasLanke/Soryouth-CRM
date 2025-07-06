
'use server';

import prisma from '@/lib/prisma';
import type { Proposal } from '@/types';
import { revalidatePath } from 'next/cache';
import { parseISO } from 'date-fns';
import { deleteFileFromS3 } from '@/lib/s3';

// Helper to map Prisma proposal to frontend Proposal type
function mapPrismaProposalToProposalType(prismaProposal: any): Proposal {
  // Ensure all numeric fields are correctly typed as numbers, especially Decimals from Prisma
  return {
    ...prismaProposal,
    proposalDate: prismaProposal.proposalDate.toISOString(),
    createdAt: prismaProposal.createdAt.toISOString(),
    updatedAt: prismaProposal.updatedAt.toISOString(),
    capacity: Number(prismaProposal.capacity),
    ratePerWatt: Number(prismaProposal.ratePerWatt),
    inverterRating: Number(prismaProposal.inverterRating),
    baseAmount: Number(prismaProposal.baseAmount),
    cgstAmount: Number(prismaProposal.cgstAmount),
    sgstAmount: Number(prismaProposal.sgstAmount),
    subtotalAmount: Number(prismaProposal.subtotalAmount),
    finalAmount: Number(prismaProposal.finalAmount),
    subsidyAmount: Number(prismaProposal.subsidyAmount),
    unitRate: prismaProposal.unitRate ? Number(prismaProposal.unitRate) : undefined,
    requiredSpace: prismaProposal.requiredSpace ? Number(prismaProposal.requiredSpace) : undefined,
    generationPerDay: prismaProposal.generationPerDay ? Number(prismaProposal.generationPerDay) : undefined,
    generationPerYear: prismaProposal.generationPerYear ? Number(prismaProposal.generationPerYear) : undefined,
    savingsPerYear: prismaProposal.savingsPerYear ? Number(prismaProposal.savingsPerYear) : undefined,
    droppedLeadId: prismaProposal.droppedLeadId ?? undefined,
  };
}

export async function createOrUpdateProposal(data: Partial<Proposal>): Promise<Proposal | null> {
    const { id, createdAt, updatedAt, ...proposalData } = data;

    const dataToSave = {
      ...proposalData,
      proposalDate: proposalData.proposalDate ? parseISO(proposalData.proposalDate) : new Date(),
    };
    
    // Remove undefined fields so Prisma doesn't try to update them
    Object.keys(dataToSave).forEach(key => dataToSave[key as keyof typeof dataToSave] === undefined && delete dataToSave[key as keyof typeof dataToSave]);

    try {
        let savedProposal;
        if (id) {
            // Fetch the old proposal to get the old file URLs
            const oldProposal = await prisma.proposal.findUnique({
                where: { id },
                select: { pdfUrl: true, docxUrl: true }
            });

            // Update existing proposal
            savedProposal = await prisma.proposal.update({
                where: { id },
                data: dataToSave,
            });

            // After successful update, delete old files if they exist and are different
            if (oldProposal) {
                if (oldProposal.pdfUrl && oldProposal.pdfUrl !== savedProposal.pdfUrl) {
                    try {
                        const pdfKey = new URL(oldProposal.pdfUrl).pathname.substring(1);
                        await deleteFileFromS3(pdfKey);
                    } catch (e) {
                        console.error(`Failed to delete old PDF file: ${oldProposal.pdfUrl}`, e);
                    }
                }
                if (oldProposal.docxUrl && oldProposal.docxUrl !== savedProposal.docxUrl) {
                    try {
                        const docxKey = new URL(oldProposal.docxUrl).pathname.substring(1);
                        await deleteFileFromS3(docxKey);
                    } catch (e) {
                        console.error(`Failed to delete old DOCX file: ${oldProposal.docxUrl}`, e);
                    }
                }
            }
        } else {
            // Create new proposal
            savedProposal = await prisma.proposal.create({
                data: dataToSave as any, // Cast to any to satisfy Prisma's create type which expects all fields
            });
        }

        if (data.leadId) revalidatePath(`/leads/${data.leadId}`);
        if (data.clientId) revalidatePath(`/clients/${data.clientId}`);
        revalidatePath('/proposals');
        
        return mapPrismaProposalToProposalType(savedProposal);

    } catch (error) {
        console.error("Failed to create or update proposal:", error);
        return null;
    }
}

export async function bulkCreateProposals(proposals: Partial<Proposal>[]): Promise<{ success: boolean; count: number; message?: string }> {
  try {
    const dataToSave = proposals.map(p => {
        // Explicitly build the object with only valid fields for the Proposal model
        return {
          proposalNumber: p.proposalNumber!,
          name: p.name!,
          clientType: p.clientType!,
          contactPerson: p.contactPerson!,
          location: p.location!,
          capacity: p.capacity!,
          moduleType: p.moduleType!,
          moduleWattage: p.moduleWattage!,
          dcrStatus: p.dcrStatus!,
          inverterRating: p.inverterRating!,
          inverterQty: p.inverterQty!,
          ratePerWatt: p.ratePerWatt!,
          proposalDate: p.proposalDate ? parseISO(p.proposalDate) : new Date(),
          baseAmount: p.baseAmount!,
          cgstAmount: p.cgstAmount!,
          sgstAmount: p.sgstAmount!,
          subtotalAmount: p.subtotalAmount!,
          finalAmount: p.finalAmount!,
          subsidyAmount: p.subsidyAmount!,
          requiredSpace: p.requiredSpace,
          generationPerDay: p.generationPerDay,
          generationPerYear: p.generationPerYear,
          unitRate: p.unitRate,
          savingsPerYear: p.savingsPerYear,
          laKitQty: p.laKitQty,
          acdbDcdbQty: p.acdbDcdbQty,
          earthingKitQty: p.earthingKitQty,
          pdfUrl: p.pdfUrl,
          docxUrl: p.docxUrl,
          templateId: p.templateId,
          leadId: p.leadId || null,
          clientId: p.clientId || null,
        };
    });

    const result = await prisma.proposal.createMany({
      data: dataToSave,
      skipDuplicates: true
    });
    
    revalidatePath('/proposals');
    proposals.forEach(p => {
        if (p.leadId) revalidatePath(`/leads/${p.leadId}`);
        if (p.clientId) revalidatePath(`/clients/${p.clientId}`);
    });
    
    return { success: true, count: result.count };

  } catch (error) {
    console.error("Failed to bulk create proposals:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, count: 0, message: errorMessage };
  }
}

export async function getProposalsForLead(leadId: string): Promise<Proposal[]> {
    if (!leadId) return [];
    try {
        const proposals = await prisma.proposal.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' },
        });
        return proposals.map(mapPrismaProposalToProposalType);
    } catch (error) {
        console.error(`Failed to fetch proposals for lead ${leadId}:`, error);
        return [];
    }
}

export async function getProposalsForClient(clientId: string): Promise<Proposal[]> {
     if (!clientId) return [];
    try {
        const proposals = await prisma.proposal.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
        });
        return proposals.map(mapPrismaProposalToProposalType);
    } catch (error) {
        console.error(`Failed to fetch proposals for client ${clientId}:`, error);
        return [];
    }
}

export async function getAllProposals(): Promise<Proposal[]> {
    try {
        const proposals = await prisma.proposal.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return proposals.map(mapPrismaProposalToProposalType);
    } catch (error) {
        console.error("Failed to fetch all proposals:", error);
        return [];
    }
}
