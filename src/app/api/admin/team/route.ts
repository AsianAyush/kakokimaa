import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAdminUser } from '@/lib/auth';

// POST: Add a new team member
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, role, instagram_username, image_url, sort_order, profile_link } = await req.json();

    if (!name || !role || !instagram_username) {
      return NextResponse.json({ error: 'Name, Role, and Instagram Username are required' }, { status: 400 });
    }

    const db = createServerClient();
    const { data: member, error } = await db
      .from('team_members')
      .insert([{
        name: name.trim(),
        role: role.trim(),
        instagram_username: instagram_username.trim(),
        profile_link: profile_link?.trim(),
        image_url: image_url || null,
        sort_order: sort_order || 0
      }])
      .select()
      .single();

    if (error || !member) {
      console.error('Insert team error:', error);
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
    }

    return NextResponse.json({ member, success: true });
  } catch (err) {
    console.error('Insert team exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
