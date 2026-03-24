import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('ff_token', '', { maxAge: 0, path: '/' });
  res.cookies.set('ff_admin_token', '', { maxAge: 0, path: '/' });
  return res;
}
