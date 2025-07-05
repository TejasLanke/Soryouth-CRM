
import { NextRequest, NextResponse } from 'next/server';
import * as ExcelJS from 'exceljs';
import { verifySession } from '@/lib/auth';

const headers = [
    "Name",
    "Email",
    "Phone",
    "Status",
    "Source",
    "Assigned To",
    "Kilowatt",
    "Address",
    "Priority",
    "Customer Type"
];

export async function GET(request: NextRequest) {
    const session = await verifySession();
    if (!session?.userId) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    // Create a new workbook and a worksheet using exceljs
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');
    
    // Add headers and set column widths
    worksheet.columns = headers.map(header => ({
        header,
        key: header,
        width: 25
    }));
    
    // Write the workbook to a buffer
    const buf = await workbook.xlsx.writeBuffer();
    
    // Create a response with the buffer
    const response = new NextResponse(buf, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="lead_import_template.xlsx"',
        },
    });

    return response;
}
