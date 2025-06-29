'use server';

import prisma from '@/lib/prisma';
import type { Proposal } from '@/types';
import { revalidatePath } from 'next/cache';
import { parseISO } from 'date-fns';

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
            // Update existing proposal
            savedProposal = await prisma.proposal.update({
                where: { id },
                data: dataToSave,
            });
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
