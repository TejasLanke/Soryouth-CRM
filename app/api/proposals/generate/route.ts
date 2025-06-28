
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { format, parseISO } from 'date-fns';
import type { Proposal } from '@/types';
import { getTemplateById } from '@/app/(app)/manage-templates/actions';

// This function formats the data to match the placeholders in the DOCX template.
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

    // Additional fields
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
  try {
    const { templateId, data } = await request.json();

    if (!templateId || !data) {
      return NextResponse.json({ error: 'Missing templateId or proposal data' }, { status: 400 });
    }

    const template = await getTemplateById(templateId);

    if (!template || !template.originalDocxPath) {
      return NextResponse.json({ error: 'Template not found or has no associated file.' }, { status: 404 });
    }
    
    const templateData = getTemplateData(data as Proposal);

    // Call the Python microservice
    const pythonServiceUrl = 'http://127.0.0.1:5001/generate';
    const response = await fetch(pythonServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            template_path: template.originalDocxPath,
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
    
    // Decode base64 strings to buffers
    const pdfBuffer = Buffer.from(result.pdf_b64, 'base64');
    const docxBuffer = Buffer.from(result.docx_b64, 'base64');

    // Prepare paths for saving
    const generatedDir = path.join(process.cwd(), 'public', 'generated_proposals');
    await fs.mkdir(generatedDir, { recursive: true });
    
    const baseFileName = `${data.proposalNumber}_${Date.now()}`;
    const pdfFileName = `${baseFileName}.pdf`;
    const docxFileName = `${baseFileName}.docx`;

    const pdfFilePath = path.join(generatedDir, pdfFileName);
    const docxFilePath = path.join(generatedDir, docxFileName);

    // Save both files
    await fs.writeFile(pdfFilePath, pdfBuffer);
    await fs.writeFile(docxFilePath, docxBuffer);

    const publicPdfUrl = `/generated_proposals/${pdfFileName}`;
    const publicDocxUrl = `/generated_proposals/${docxFileName}`;

    return NextResponse.json({
      success: true,
      pdfUrl: publicPdfUrl,
      docxUrl: publicDocxUrl,
    });

  } catch (error) {
    console.error('Error in proposal generation orchestrator:', error);
    let errorMessage = 'Failed to generate proposal.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
