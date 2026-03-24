import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createServerClient();

    // Fetch the ticket to verify ownership and status
    const { data: ticket, error: fetchError } = await db
      .from('tickets')
      .select('ticket_id, user_id, status')
      .eq('ticket_id', id)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only the owner can cancel
    if (ticket.user_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only pending orders can be cancelled by the user
    if (ticket.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending orders can be cancelled. Orders that are in progress or completed cannot be cancelled.' },
        { status: 400 }
      );
    }

    const { error: updateError } = await db
      .from('tickets')
      .update({ status: 'cancelled' })
      .eq('ticket_id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel order error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
