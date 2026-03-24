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

  // Verify access
  if (!admin) {
    const { data: ticket } = await db
      .from('tickets')
      .select('user_id')
      .eq('ticket_id', id)
      .single();
    if (!ticket || ticket.user_id !== user!.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Clear user unread flag
    await db.from('tickets').update({ has_unread_user: false }).eq('ticket_id', id);
  } else {
    // Clear admin unread flag
    await db.from('tickets').update({ has_unread_admin: false }).eq('ticket_id', id);
  }

  const { data: messages, error } = await db
    .from('messages')
    .select('id, sender, message_text, image_url, sent_at')
    .eq('ticket_id', id)
    .order('sent_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  const admin = await getAdminUser();

  if (!user && !admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message_text, image_url, sender: reqSender } = await req.json();

  if (!message_text && !image_url) {
    return NextResponse.json({ error: 'Message or image required' }, { status: 400 });
  }

  const db = createServerClient();
  const sender = (admin && reqSender === 'admin') ? 'admin' : 'customer';

  // Verify ownership for customers
  if (sender === 'customer' && user) {
    const { data: ticket } = await db
      .from('tickets')
      .select('user_id')
      .eq('ticket_id', id)
      .single();
    if (!ticket || ticket.user_id !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { data: msg, error } = await db
    .from('messages')
    .insert({ ticket_id: id, sender, message_text: message_text || null, image_url: image_url || null })
    .select('id, sender, message_text, image_url, sent_at')
    .single();

  if (error || !msg) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }

  // Update unread flag
  if (sender === 'admin') {
    await db.from('tickets').update({ has_unread_user: true }).eq('ticket_id', id);
  } else {
    await db.from('tickets').update({ has_unread_admin: true }).eq('ticket_id', id);
  }

  return NextResponse.json({ message: msg });
}
