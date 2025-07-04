
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { format, parseISO } from 'date-fns';
import { getTemplateById } from '@/app/(app)/manage-templates/actions';
import type { DocumentType } from '@/types';
import { uploadFileToS3, getFileFromS3 } from '@/lib/s3';
import prisma from '@/lib/prisma';

function getDocumentTemplateData(formData: any, documentType: DocumentType) {
    const formattedData: Record<string, any> = {
        date_today: format(new Date(), 'dd MMM, yyyy'),
        client_name: formData.clientName,
        client_address: formData.clientAddress,
    };

    switch (documentType) {
        case 'Purchase Order':
            Object.assign(formattedData, {
                po_date: formData.poDate ? format(parseISO(formData.poDate), 'dd MMM, yyyy') : '',
                capacity: formData.capacity,
                rate_per_watt: formData.ratePerWatt,
                total_amount: formData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                gst_amount: formData.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                grand_total_amount: formData.grandTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            });
            break;
        case 'Warranty Certificate':
            Object.assign(formattedData, {
                capacity: formData.capacity,
                module_make: formData.moduleMake,
                module_wattage: formData.moduleWattage,
                inverter_make: formData.inverterMake,
                inverter_rating: formData.inverterRating,
                date_of_commissioning: formData.dateOfCommissioning ? format(parseISO(formData.dateOfCommissioning), 'dd MMM, yyyy') : '',
            });
            break;
        case 'Work Completion Report':
             Object.assign(formattedData, {
                consumer_number: formData.consumerNumber,
                sanction_number: formData.sanctionNumber,
                sanction_date: formData.sanctionDate ? format(parseISO(formData.sanctionDate), 'dd MMM, yyyy') : '',
                work_completion_date: formData.workCompletionDate ? format(parseISO(formData.workCompletionDate), 'dd MMM, yyyy') : '',
            });
            break;
        case 'Net Metering Agreement':
            Object.assign(formattedData, {
                consumer_number: formData.consumerNumber,
                agreement_date: formData.agreementDate ? format(parseISO(formData.agreementDate), 'dd MMM, yyyy') : '',
                capacity: formData.capacity,
                discom_section: formData.discomSection,
                discom_subdivision: formData.discomSubdivision,
            });
            break;
        case 'Annexure I':
             Object.assign(formattedData, {
                capacity: formData.capacity,
                sanctioned_capacity: formData.sanctionedCapacity,
                capacity_type: formData.capacityType,
                date_of_installation: formData.dateOfInstallation ? format(parseISO(formData.dateOfInstallation), 'dd MMM, yyyy') : '',
                phone_number: formData.phoneNumber,
                consumer_number: formData.consumerNumber,
                email: formData.email,
                inverter_details: formData.inverterDetails,
                inverter_rating: formData.inverterRating,
                module_wattage: formData.moduleWattage,
                number_of_modules: formData.numberOfModules,
                project_model: formData.projectModel,
                district: formData.district,
            });
            break;
        case 'DCR Declaration':
            Object.assign(formattedData, {
                title: formData.title,
                details: formData.details
            });
            break;
        default:
            Object.assign(formattedData, formData);
            break;
    }

    return formattedData;
}


export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  try {
    const { templateId, formData, documentType } = await request.json();

    if (!templateId || !formData || !documentType) {
      return NextResponse.json({ error: 'Missing templateId, formData, or documentType' }, { status: 400 });
    }

    const template = await getTemplateById(templateId);

    if (!template || !template.originalDocxPath) {
      return NextResponse.json({ error: 'Template not found or has no associated file.' }, { status: 404 });
    }
    
    // Use SDK to get the file from S3 instead of a public fetch
    const s3Url = new URL(template.originalDocxPath);
    const templateKey = s3Url.pathname.substring(1); // Remove leading '/'
    const templateBuffer = await getFileFromS3(templateKey);
    
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `template-${Date.now()}.docx`);
    await fs.writeFile(tempFilePath, templateBuffer);

    const templateData = getDocumentTemplateData(formData, documentType);
    
    const pythonServiceUrl = 'http://127.0.0.1:5001/generate';
    const response = await fetch(pythonServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            // Pass the path to the temporary local file
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

    const baseKey = `documents/${formData.clientName?.replace(/\s/g, '_') || 'document'}_${documentType.replace(/\s/g, '_')}_${Date.now()}`;
    const pdfKey = `${baseKey}.pdf`;
    const docxKey = `${baseKey}.docx`;

    const [pdfUrl, docxUrl] = await Promise.all([
        uploadFileToS3(pdfBuffer, pdfKey, 'application/pdf'),
        uploadFileToS3(docxBuffer, docxKey, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ]);

    // Save metadata to the new GeneratedDocument table
    await prisma.generatedDocument.create({
      data: {
        clientName: formData.clientName,
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
      // Clean up the temporary file
      if (tempFilePath) {
          await fs.unlink(tempFilePath).catch(err => console.error(`Failed to delete temp file: ${tempFilePath}`, err));
      }
  }
}
