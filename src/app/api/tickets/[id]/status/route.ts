import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAdminUser } from '@/lib/auth';
import { sendPushNotification } from '@/lib/notifications';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { status } = await req.json();
  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = createServerClient();

  // Fetch customer user_id before update
  const { data: ticketInfo } = await db
    .from('tickets')
    .select('user_id')
    .eq('ticket_id', id)
    .single();

  const { error } = await db.from('tickets').update({ status }).eq('ticket_id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }

  // Notify the customer about status change
  if (ticketInfo) {
    const statusLabel = status.replace('_', ' ');
    await sendPushNotification({
      userIds: [ticketInfo.user_id],
      title: '✅ Order Status Updated',
      body: `Your order ${id} is now ${statusLabel}`,
      url: `/ticket/${id}`,
      baseUrl: req.nextUrl.origin,
    });
  }

  return NextResponse.json({ success: true });
}
