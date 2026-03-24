import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAdminUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const db = createServerClient();
  let query = db
    .from('tickets')
    .select('ticket_id, instagram_username, items, total_price, status, created_at, users(name, email)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: tickets, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }

  let filtered = tickets || [];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((t: any) =>
      t.ticket_id.toLowerCase().includes(q) ||
      t.instagram_username.toLowerCase().includes(q) ||
      t.users?.name?.toLowerCase().includes(q)
    );
  }

  // Count stats
  const all = tickets || [];
  const stats = {
    total: all.length,
    pending: all.filter((t: { status: string }) => t.status === 'pending').length,
    in_progress: all.filter((t: { status: string }) => t.status === 'in_progress').length,
    completed: all.filter((t: { status: string }) => t.status === 'completed').length,
  };

  return NextResponse.json({ tickets: filtered, stats });
}
