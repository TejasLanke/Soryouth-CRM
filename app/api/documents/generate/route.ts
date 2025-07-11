
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { format, parseISO } from 'date-fns';
import { getTemplateById } from '@/app/(app)/manage-templates/actions';
import type { DocumentType } from '@/types';
import { uploadFileToS3, getFileFromS3 } from '@/lib/s3';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';

function camelCaseToTitleCase(text: string) {
    const result = text.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}

function getTemplateData(formData: any, documentType: DocumentType) {
    const data: Record<string, any> = {
        date_today: format(new Date(), 'dd MMM, yyyy'),
    };
    for (const key in formData) {
        if (Object.prototype.hasOwnProperty.call(formData, key)) {
            const value = formData[key];
            const placeholderKey = key.replace(/ /g, '_').toLowerCase();
            data[placeholderKey] = value;
        }
    }
    return data;
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  const session = await verifySession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { templateId, formData, documentType } = await request.json();

    if (!templateId || !formData || !documentType) {
      return NextResponse.json({ error: 'Missing templateId, formData, or documentType' }, { status: 400 });
    }

    const template = await getTemplateById(templateId);

    if (!template || !template.originalDocxPath) {
      return NextResponse.json({ error: 'Template not found or has no associated file.' }, { status: 404 });
    }
    
    const s3Url = new URL(template.originalDocxPath);
    const templateKey = s3Url.pathname.substring(1);
    const templateBuffer = await getFileFromS3(templateKey);
    
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `template-${Date.now()}.docx`);
    await fs.writeFile(tempFilePath, templateBuffer);

    const templateData = getTemplateData(formData, documentType);
    
    // Default to the proposal generator service for now
    const pythonServiceUrl = process.env.PYTHON_MICROSERVICE_URL || 'http://127.0.0.1:5001/generate';
    const response = await fetch(pythonServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            template_path: tempFilePath,
            data: templateData
        })
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || `Python service failed with status ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.pdf_b64 || !result.docx_b64) {
      throw new Error("Python service returned an invalid payload.");
    }
    
    const pdfBuffer = Buffer.from(result.pdf_b64, 'base64');
    const docxBuffer = Buffer.from(result.docx_b64, 'base64');

    const clientName = formData.client_name || formData.clientName || 'document';
    const baseKey = `documents/${clientName.replace(/\s/g, '_')}_${documentType.replace(/\s/g, '_')}_${Date.now()}`;
    const pdfKey = `${baseKey}.pdf`;
    const docxKey = `${baseKey}.docx`;

    const [pdfUrl, docxUrl] = await Promise.all([
        uploadFileToS3(pdfBuffer, pdfKey, 'application/pdf'),
        uploadFileToS3(docxBuffer, docxKey, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ]);

    await prisma.generatedDocument.create({
      data: {
        clientName: clientName,
        documentType: documentType,
        pdfUrl: pdfUrl,
        docxUrl: docxUrl,
      },
    });

    return NextResponse.json({
      success: true,
      pdfUrl: pdfUrl,
      docxUrl: docxUrl,
    });

  } catch (error) {
    console.error('Error in document generation orchestrator:', error);
    let errorMessage = 'Failed to generate document.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
      if (tempFilePath) {
          await fs.unlink(tempFilePath).catch(err => console.error(`Failed to delete temp file: ${tempFilePath}`, err));
      }
  }
}
