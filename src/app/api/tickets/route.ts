import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { CATEGORY_LIMITS } from '@/lib/services-data';
import { sendPushNotification, getAdminUserIds } from '@/lib/notifications';

const ONLINE_HOURS_MSG = `\n\n🕐 Our Processing Hours (IST):\n- 11:00 AM – 3:00 PM\n- 7:00 PM – 9:00 PM\n\nWe check orders during these times daily. If you message outside these hours, we'll reply as soon as we're back online. Thank you for your patience! 🙏`;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { instagram_username, items, total_price, payment_method, usdt_total } = await req.json();

    if (!instagram_username || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Server-side quantity validation
    for (const item of items) {
      const lim = CATEGORY_LIMITS[item.category];
      if (lim) {
        if (item.qty < lim.min || item.qty > lim.max) {
          return NextResponse.json({
            error: `❌ ${item.category} quantity must be between ${lim.min.toLocaleString('en-IN')} and ${lim.max.toLocaleString('en-IN')}. Please update your cart.`,
          }, { status: 400 });
        }
      }
    }

    const db = createServerClient();

    // Enforce 3-order limit
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

    const finalPaymentMethod = payment_method === 'crypto' ? 'crypto' : 'upi';

    const { data: ticket, error } = await db
      .from('tickets')
      .insert({
        ticket_id,
        user_id: user.userId,
        instagram_username,
        items,
        total_price,
        status: 'pending',
        payment_method: finalPaymentMethod,
      })
      .select('ticket_id, status, created_at')
      .single();

    if (error || !ticket) {
      console.error('Create ticket error:', error);
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }

    // Build welcome message based on payment method
    let welcomeMessage = '';
    if (finalPaymentMethod === 'upi') {
      welcomeMessage = `Hi ${user.name}! 👋 We've received your order (${ticket_id}).\n\nPlease pay ₹${total_price} to our UPI ID:\n\nasianayush@fam\n\nAfter paying, send the payment screenshot in this chat and we'll process your order right away. Thank you for choosing FullFame Services! 🚀${ONLINE_HOURS_MSG}`;
    } else {
      const usdtAmount = usdt_total || '...';
      welcomeMessage = `Hi ${user.name}! 👋 We've received your order (${ticket_id}).\n\nPlease send ${usdtAmount} USDT (BEP20 network only) to:\n\n0xaf497EC817163d9A2B1603bA283Bf8abba4a306B\n\n⚠️ Make sure to use BEP20 network only or your funds will be lost.\n\nAfter sending, share the transaction hash or screenshot in this chat and we'll process your order right away. Thank you for choosing FullFame Services! 🚀${ONLINE_HOURS_MSG}`;
    }

    await db.from('messages').insert({
      ticket_id,
      sender: 'admin',
      message_text: welcomeMessage,
    });

    // Notify admin about new order
    const baseUrl = req.nextUrl.origin;
    const adminIds = await getAdminUserIds(db);
    if (adminIds.length > 0) {
      await sendPushNotification({
        userIds: adminIds,
        title: '🛍️ New Order!',
        body: `${user.name} placed order ${ticket_id}`,
        url: `/admin/ticket/${ticket_id}`,
        baseUrl,
      });
    }

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
      .select('ticket_id, instagram_username, items, total_price, status, created_at, has_unread_user, payment_method')
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
