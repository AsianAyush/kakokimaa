import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = createServerClient();

    // Check if email already exists
    const { data: existingEmail } = await db
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Check if username already exists (case-insensitive)
    const { data: existingName } = await db
      .from('users')
      .select('id')
      .ilike('name', name.trim())
      .single();

    if (existingName) {
      return NextResponse.json({ error: 'Username is already taken by another person' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const { data: user, error } = await db
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'customer',
      })
      .select('id, name, email, role')
      .single();

    if (error || !user) {
      console.error('Signup error:', error);
      return NextResponse.json({ error: 'Failed to create account. Username might be taken.' }, { status: 500 });
    }

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
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

