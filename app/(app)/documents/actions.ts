
'use server';

import prisma from '@/lib/prisma';
import { deleteFileFromS3 } from '@/lib/s3';
import { revalidatePath } from 'next/cache';
import type { GeneratedDocument, FinancialDocument, FinancialDocumentStatus } from '@/types';
import { verifySession } from '@/lib/auth';

// Helper to map Prisma document to frontend GeneratedDocument type
function mapPrismaGeneratedDocument(doc: any): GeneratedDocument {
  return {
    ...doc,
    createdAt: doc.createdAt.toISOString(),
  };
}

// Helper to map Prisma document to frontend FinancialDocument type
function mapPrismaFinancialDocument(doc: any): FinancialDocument {
    return {
        ...doc,
        createdAt: doc.createdAt.toISOString(),
        reviewedAt: doc.reviewedAt?.toISOString() ?? null,
        reviewedBy: doc.reviewedBy ? { id: doc.reviewedBy.id, name: doc.reviewedBy.name } : null,
    };
}


export async function getGeneratedDocuments(documentType: string): Promise<GeneratedDocument[]> {
  try {
    const documents = await prisma.generatedDocument.findMany({
      where: { documentType },
      orderBy: { createdAt: 'desc' },
    });
    return documents.map(mapPrismaGeneratedDocument);
  } catch (error: any) {
    console.error(`Failed to get documents for type ${documentType}:`, error);
    return [];
  }
}

export async function getFinancialDocuments(documentType: string): Promise<FinancialDocument[]> {
    try {
        const documents = await prisma.financialDocument.findMany({
            where: { documentType },
            orderBy: { createdAt: 'desc' },
            include: { reviewedBy: true }
        });
        return documents.map(mapPrismaFinancialDocument);
    } catch (error) {
        console.error(`Failed to get financial documents for type ${documentType}:`, error);
        return [];
    }
}

export async function getFinancialDocumentById(id: string): Promise<FinancialDocument | null> {
    if (!id) return null;
    try {
        const doc = await prisma.financialDocument.findUnique({
            where: { id },
            include: { reviewedBy: true }
        });
        return doc ? mapPrismaFinancialDocument(doc) : null;
    } catch (error) {
        console.error(`Failed to get financial document by ID ${id}:`, error);
        return null;
    }
}

export async function reviewFinancialDocument(id: string, status: FinancialDocumentStatus): Promise<{ success: boolean; error?: string }> {
    const session = await verifySession();
    if (!session?.userId) {
        return { success: false, error: 'Authentication required.' };
    }
    
    if (!['Approved', 'Rejected'].includes(status)) {
        return { success: false, error: 'Invalid status provided.' };
    }

    try {
        const doc = await prisma.financialDocument.findUnique({ where: { id }});
        if (!doc) {
             return { success: false, error: 'Document not found.' };
        }
        
        await prisma.financialDocument.update({
            where: { id },
            data: {
                status,
                reviewedById: session.userId,
                reviewedAt: new Date(),
            },
        });
        
        revalidatePath(`/documents/${encodeURIComponent(doc.documentType)}`);
        revalidatePath(`/financial-documents/approve/${id}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to review financial document:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}


export async function deleteGeneratedDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const docToDelete = await prisma.generatedDocument.findUnique({
      where: { id },
    });

    if (!docToDelete) {
      return { success: false, error: 'Document record not found in database.' };
    }

    const pdfKey = new URL(docToDelete.pdfUrl).pathname.substring(1);
    const docxKey = new URL(docToDelete.docxUrl).pathname.substring(1);

    await Promise.all([
      deleteFileFromS3(pdfKey),
      deleteFileFromS3(docxKey)
    ]);
    
    await prisma.generatedDocument.delete({
      where: { id: docToDelete.id },
    });

    revalidatePath(`/documents/${encodeURIComponent(docToDelete.documentType)}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete document:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function deleteFinancialDocument(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const docToDelete = await prisma.financialDocument.findUnique({
      where: { id },
    });

    if (!docToDelete) {
      return { success: false, error: 'Financial document record not found in database.' };
    }

    const pdfKey = new URL(docToDelete.pdfUrl).pathname.substring(1);
    const docxKey = new URL(docToDelete.docxUrl).pathname.substring(1);

    await Promise.all([
      deleteFileFromS3(pdfKey),
      deleteFileFromS3(docxKey)
    ]);
    
    await prisma.financialDocument.delete({
      where: { id: docToDelete.id },
    });

    revalidatePath(`/documents/${encodeURIComponent(docToDelete.documentType)}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete financial document:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
