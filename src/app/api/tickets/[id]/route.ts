import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser, getAdminUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  const admin = await getAdminUser();

  if (!user && !admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServerClient();

  const query = db
    .from('tickets')
    .select('ticket_id, user_id, instagram_username, items, total_price, status, created_at, users(name, email)')
    .eq('ticket_id', id)
    .single();

  const { data: ticket, error } = await query;

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  // Access control: owner or admin
  if (!admin && user && ticket.user_id !== user.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ ticket });
}
