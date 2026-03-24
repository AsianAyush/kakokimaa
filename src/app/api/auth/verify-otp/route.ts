import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const db = createServerClient();

    // Verify OTP
    const { data: record, error: fetchError } = await db
      .from('filter_otps')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    if (record.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 });
    }

    if (new Date(record.expires_at) < new Date()) {
      await db.from('filter_otps').delete().eq('email', email.toLowerCase().trim());
      return NextResponse.json({ error: 'OTP has expired. Please sign up again.' }, { status: 400 });
    }

    // OTP is valid. Create user
    const { name, password } = record.user_details as { name: string; password: string };

    const { data: user, error: insertError } = await db
      .from('users')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        password,
        role: 'customer',
      })
      .select('id, name, email, role')
      .single();

    if (insertError || !user) {
      console.error('Signup insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create account. Email might already be taken.' }, { status: 500 });
    }

    // Clean up OTP record
    await db.from('filter_otps').delete().eq('email', email.toLowerCase().trim());

    // Generate JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'customer',
    });

    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    res.cookies.set('ff_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
