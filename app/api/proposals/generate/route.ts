
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { format, parseISO } from 'date-fns';
import type { Proposal } from '@/types';
import { getTemplateById } from '@/app/(app)/manage-templates/actions';
import { uploadFileToS3, getFileFromS3 } from '@/lib/s3';

function getTemplateData(proposal: Proposal) {
  return {
    name: proposal.name,
    contact_person: proposal.contactPerson,
    location: proposal.location,
    client_type: proposal.clientType,
    proposal_number: proposal.proposalNumber,
    proposal_date: format(parseISO(proposal.proposalDate), 'dd MMM, yyyy'),
    capacity: proposal.capacity,
    module_type: proposal.moduleType,
    module_wattage: proposal.moduleWattage,
    dcr_status: proposal.dcrStatus,
    inverter_rating: proposal.inverterRating,
    inverter_qty: proposal.inverterQty,
    rate_per_watt: proposal.ratePerWatt.toLocaleString('en-IN'),
    base_amount: proposal.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    cgst_amount: proposal.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    sgst_amount: proposal.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    final_amount: proposal.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    subsidy_amount: proposal.subsidyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    date_today: format(new Date(), 'dd MMM, yyyy'),
    required_space: (proposal.requiredSpace ?? 0).toLocaleString('en-IN'),
    generation_per_day: (proposal.generationPerDay ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    generation_per_year: (proposal.generationPerYear ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    unit_rate: (proposal.unitRate ?? 0).toLocaleString('en-IN'),
    savings_per_year: (proposal.savingsPerYear ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    la_kit_qty: proposal.laKitQty ?? 0,
    acdb_dcdb_qty: proposal.acdbDcdbQty ?? 0,
    earthing_kit_qty: proposal.earthingKitQty ?? 0,
  };
}


export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  try {
    const { templateId, data } = await request.json();

    if (!templateId || !data) {
      return NextResponse.json({ error: 'Missing templateId or proposal data' }, { status: 400 });
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
    
    const templateData = getTemplateData(data as Proposal);

    const pythonServiceUrl = 'http://127.0.0.1:5001/generate';
    const response = await fetch(pythonServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            template_path: tempFilePath, // Pass path to temp file
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

    const baseKey = `proposals/${data.proposalNumber}_${Date.now()}`;
    const pdfKey = `${baseKey}.pdf`;
    const docxKey = `${baseKey}.docx`;

    const [pdfUrl, docxUrl] = await Promise.all([
        uploadFileToS3(pdfBuffer, pdfKey, 'application/pdf'),
        uploadFileToS3(docxBuffer, docxKey, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ]);

    return NextResponse.json({
      success: true,
      pdfUrl: pdfUrl,
      docxUrl: docxUrl,
    });

  } catch (error) {
    console.error('Error in proposal generation orchestrator:', error);
    let errorMessage = 'Failed to generate proposal.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    // Clean up the temporary file in all cases
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(err => console.error(`Failed to delete temp file: ${tempFilePath}`, err));
    }
  }
}
