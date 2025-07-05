
import { NextResponse, type NextRequest } from 'next/server';
import { uploadFileToS3 } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string | 'misc';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    
    // Sanitize filename and create a unique key for S3
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueKey = `uploads/${folder}/${Date.now()}-${safeFilename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3 instead of local filesystem
    const fileUrl = await uploadFileToS3(buffer, uniqueKey, file.type);

    return NextResponse.json({
      success: true,
      filePath: fileUrl, // Return the S3 URL
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ error: 'Failed to process file.', details: (error as Error).message }, { status: 500 });
  }
}
