import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instagram_username, items, total_price, likes_link, views_link } = await req.json();

    if (!instagram_username || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = createServerClient();

    // Enforce 3-order limit: count active (pending/in_progress) orders
    const { count: activeCount } = await db
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.userId)
      .in('status', ['pending', 'in_progress']);

    if ((activeCount || 0) >= 3) {
      return NextResponse.json({
        error: 'You have 3 active orders already. Please wait for one to be completed before placing a new order.',
      }, { status: 400 });
    }



    // Generate unique ticket ID: FF-YYYY-XXXX
    const year = new Date().getFullYear();
    const { count } = await db.from('tickets').select('*', { count: 'exact', head: true });
    const seq = String((count || 0) + 1).padStart(4, '0');
    const ticket_id = `FF-${year}-${seq}`;

    const { data: ticket, error } = await db
      .from('tickets')
      .insert({
        ticket_id,
        user_id: user.userId,
        instagram_username,
        items,
        total_price,
        status: 'pending',
      })
      .select('ticket_id, status, created_at')
      .single();

    if (error || !ticket) {
      console.error('Create ticket error:', error);
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }

    // Auto-create first system message
    let extraLinks = '';
    if (likes_link || views_link) {
      extraLinks = '\n\nProvided Links:';
      if (likes_link) extraLinks += `\n- Likes: ${likes_link}`;
      if (views_link) extraLinks += `\n- Views: ${views_link}`;
    }

    await db.from('messages').insert({
      ticket_id,
      sender: 'admin',
      message_text: `Hi ${user.name}! 👋 We've received your order (${ticket_id}). Our team will review it shortly and send you a payment QR code. Thank you for choosing FullFame Services!${extraLinks}`,
    });

    return NextResponse.json({ success: true, ticket_id, status: ticket.status });
  } catch (err) {
    console.error('Ticket creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = createServerClient();
    const { data: tickets, error } = await db
      .from('tickets')
      .select('ticket_id, instagram_username, items, total_price, status, created_at, has_unread_user')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error('Get tickets error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
