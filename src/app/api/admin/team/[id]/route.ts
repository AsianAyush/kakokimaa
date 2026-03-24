import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAdminUser } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const { name, role, instagram_username, image_url, sort_order, profile_link } = await req.json();
    const db = createServerClient();

    const { data: member, error } = await db
      .from('team_members')
      .update({
        name: name?.trim(),
        role: role?.trim(),
        instagram_username: instagram_username?.trim(),
        profile_link: profile_link?.trim(),
        image_url,
        sort_order
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !member) {
      console.error('Update team error:', error);
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }

    return NextResponse.json({ member, success: true });
  } catch (err) {
    console.error('Update team exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const db = createServerClient();
    const { error } = await db.from('team_members').delete().eq('id', id);

    if (error) {
      console.error('Delete team error:', error);
      return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete team exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
