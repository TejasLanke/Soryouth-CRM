
'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const generatedDocsDir = path.join(process.cwd(), 'public', 'generated_documents');

export interface GeneratedDocument {
  clientName: string;
  documentType: string;
  timestamp: string;
  pdfUrl: string;
  docxUrl: string;
}

// Function to ensure the directory exists
async function ensureDirectoryExists() {
    try {
        await fs.access(generatedDocsDir);
    } catch {
        await fs.mkdir(generatedDocsDir, { recursive: true });
    }
}

export async function getGeneratedDocuments(documentType: string): Promise<GeneratedDocument[]> {
  await ensureDirectoryExists();
  try {
    const files = await fs.readdir(generatedDocsDir);
    const documentTypeSlug = documentType.replace(/\s/g, '_');
    
    const documents: GeneratedDocument[] = files
      .filter(file => file.endsWith('.pdf') && file.includes(`_${documentTypeSlug}_`))
      .map(pdfFile => {
        const docxFile = pdfFile.replace(/\.pdf$/, '.docx');
        const fileNameNoExt = pdfFile.replace(/\.pdf$/, '');
        
        // This is more robust: it splits on the last underscore, which separates the timestamp.
        const lastUnderscoreIndex = fileNameNoExt.lastIndexOf('_');
        const timestamp = fileNameNoExt.substring(lastUnderscoreIndex + 1);
        const nameAndType = fileNameNoExt.substring(0, lastUnderscoreIndex);
        
        // The type slug is at the end of the nameAndType string
        const clientName = nameAndType.replace(`_${documentTypeSlug}`, '').replace(/_/g, ' ');

        return {
          clientName: clientName,
          documentType,
          timestamp: new Date(parseInt(timestamp)).toISOString(),
          pdfUrl: `/generated_documents/${pdfFile}`,
          docxUrl: `/generated_documents/${docxFile}`,
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return documents;
  } catch (error: any) {
    console.error(`Failed to get documents for type ${documentType}:`, error);
    if (error.code === 'ENOENT') {
        return []; // Directory doesn't exist yet, return empty array.
    }
    throw error;
  }
}

export async function deleteGeneratedDocument(pdfUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!pdfUrl.startsWith('/generated_documents/')) {
        return { success: false, error: 'Invalid file path.' };
    }
    
    const pdfFileName = path.basename(pdfUrl);
    const docxFileName = pdfFileName.replace('.pdf', '.docx');

    const pdfFilePath = path.join(generatedDocsDir, pdfFileName);
    const docxFilePath = path.join(generatedDocsDir, docxFileName);

    // Delete both files, ignoring errors if one doesn't exist
    await fs.unlink(pdfFilePath).catch(e => console.warn(`Could not delete PDF, it might not exist: ${pdfFilePath}`, e));
    await fs.unlink(docxFilePath).catch(e => console.warn(`Could not delete DOCX, it might not exist: ${docxFilePath}`, e));
    
    // Extract document type from filename to revalidate the correct path
    const documentTypeSlugWithUnderscores = pdfFileName.split('_').slice(1, -1).join('_');
    const documentType = documentTypeSlugWithUnderscores.replace(/_/g, ' ');
    
    revalidatePath(`/documents/${encodeURIComponent(documentType)}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete document:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
