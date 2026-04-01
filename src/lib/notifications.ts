/**
 * Helper to trigger push notifications from server-side API routes.
 * Calls the internal /api/notifications/send endpoint.
 */
export async function sendPushNotification({
  userIds,
  title,
  body,
  url,
  baseUrl,
}: {
  userIds: number[];
  title: string;
  body: string;
  url: string;
  baseUrl: string;
}) {
  try {
    await fetch(`${baseUrl}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: userIds, title, body, url }),
    });
  } catch (err) {
    // Non-critical — log but don't fail the main request
    console.error('sendPushNotification error:', err);
  }
}

/**
 * Returns the admin user ID from the push_subscriptions table.
 * Admin is identified by the ADMIN_EMAIL env variable.
 */
export async function getAdminUserIds(db: ReturnType<typeof import('@/lib/supabase').createServerClient>): Promise<number[]> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return [];

  const { data } = await db
    .from('users')
    .select('id')
    .eq('email', adminEmail)
    .single();

  return data ? [data.id] : [];
}
