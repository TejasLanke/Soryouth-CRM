
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getPresignedUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Missing S3 object key' }, { status: 400 });
  }

  try {
    const url = await getPresignedUrl(key);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Failed to generate presigned URL:', error);
    return NextResponse.json({ error: 'Could not generate secure URL.' }, { status: 500 });
  }
}
