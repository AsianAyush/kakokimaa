import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET: Fetch all team members (Public)
export async function GET(req: NextRequest) {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from('team_members')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch team error:', error);
      return NextResponse.json({ error: 'Failed to fully load team' }, { status: 500 });
    }

    return NextResponse.json({ members: data || [] });
  } catch (err) {
    console.error('Fetch team exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
