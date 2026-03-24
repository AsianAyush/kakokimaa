import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordRaw = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPasswordRaw) {
      console.error('Missing admin credentials in env');
      return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 });
    }

    if (email !== adminEmail) {
      console.error(`Email mismatch: got "${email}", expected "${adminEmail}"`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Support both plain and bcrypt-hashed passwords in env
    let valid = false;
    if (adminPasswordRaw.startsWith('$2')) {
      valid = await bcrypt.compare(password, adminPasswordRaw);
    } else {
      valid = password === adminPasswordRaw;
    }

    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({
      userId: 0,
      email: adminEmail,
      name: 'Admin',
      role: 'admin',
    });

    const res = NextResponse.json({ success: true });
    res.cookies.set('ff_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
