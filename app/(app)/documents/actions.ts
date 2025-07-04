
'use server';

import prisma from '@/lib/prisma';
import { deleteFileFromS3 } from '@/lib/s3';
import { revalidatePath } from 'next/cache';
import type { GeneratedDocument } from '@/types';

// Helper to map Prisma document to frontend GeneratedDocument type
function mapPrismaGeneratedDocument(doc: any): GeneratedDocument {
  return {
    ...doc,
    createdAt: doc.createdAt.toISOString(),
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

export async function deleteGeneratedDocument(pdfUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!pdfUrl) {
      return { success: false, error: 'Invalid file URL provided.' };
    }

    // Find the document record in the database using the PDF URL
    const docToDelete = await prisma.generatedDocument.findFirst({
      where: { pdfUrl },
    });

    if (!docToDelete) {
      return { success: false, error: 'Document record not found in database.' };
    }

    // Extract keys from URLs for S3 deletion
    const pdfKey = new URL(docToDelete.pdfUrl).pathname.substring(1);
    const docxKey = new URL(docToDelete.docxUrl).pathname.substring(1);

    // Delete files from S3
    await Promise.all([
      deleteFileFromS3(pdfKey),
      deleteFileFromS3(docxKey)
    ]);
    
    // Delete the record from the database
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
