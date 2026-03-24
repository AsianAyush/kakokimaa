import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAdminUser } from '@/lib/auth';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  const user = await getAuthUser();
  if (!admin && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const db = createServerClient();
  const fileName = `qr-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await db.storage
    .from('qr-codes')
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
  }

  const { data: urlData } = db.storage.from('qr-codes').getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
}
