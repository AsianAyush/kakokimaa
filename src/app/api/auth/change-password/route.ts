import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser, hashPassword, comparePassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both fields are required' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const db = createServerClient();
  const { data: u } = await db.from('users').select('password').eq('id', user.userId).single();
  if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const valid = await comparePassword(currentPassword, u.password);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });

  const hashed = await hashPassword(newPassword);
  await db.from('users').update({ password: hashed }).eq('id', user.userId);

  return NextResponse.json({ success: true });
}
