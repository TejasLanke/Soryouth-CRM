
import { NextResponse, type NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

const ensureUploadDirExists = async () => {
    try {
        await fs.access(uploadDir);
    } catch (error) {
        await fs.mkdir(uploadDir, { recursive: true });
    }
};

export async function POST(request: NextRequest) {
  await ensureUploadDirExists();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }
    
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(file.name);

    // Generate a unique filename to prevent overwrites
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${safeFilename}`;
    const filepath = path.join(uploadDir, uniqueFilename);
    const publicFilePath = `/uploads/${uniqueFilename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      filePath: publicFilePath,
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ error: 'Failed to process file.', details: (error as Error).message }, { status: 500 });
  }
}
