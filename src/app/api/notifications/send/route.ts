import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerClient } from '@/lib/supabase';

// Configure VAPID details from environment variables only
webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { user_ids, title, body, url } = await req.json();

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: 'user_ids array required' }, { status: 400 });
    }
    if (!title || !body || !url) {
      return NextResponse.json({ error: 'title, body and url are required' }, { status: 400 });
    }

    const db = createServerClient();

    // Fetch all subscriptions for the given user IDs
    const { data: subs, error } = await db
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', user_ids);

    if (error) {
      console.error('Fetch subscriptions error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const payload = JSON.stringify({ title, body, url });
    let sent = 0;
    const staleEndpoints: string[] = [];

    await Promise.allSettled(
      subs.map(async (row) => {
        try {
          await webpush.sendNotification(row.subscription as webpush.PushSubscription, payload);
          sent++;
        } catch (e: unknown) {
          const err = e as { statusCode?: number; endpoint?: string };
          // Remove stale subscriptions (410 Gone or 404)
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            staleEndpoints.push((row.subscription as { endpoint: string }).endpoint);
          } else {
            console.error('Push send error:', e);
          }
        }
      })
    );

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await db
        .from('push_subscriptions')
        .delete()
        .in('subscription->>endpoint', staleEndpoints);
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error('Send notification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
