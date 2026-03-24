import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getAdminUser } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  const admin = await getAdminUser();
  if (!user && !admin) return NextResponse.json({ user: null }, { status: 200 });

  let unreadCount = 0;
  const db = createServerClient();
  
  if (admin) {
    const { count } = await db.from('tickets').select('*', { count: 'exact', head: true }).eq('has_unread_admin', true);
    unreadCount = count || 0;
    return NextResponse.json({
      user: { id: admin.userId, name: admin.name, email: admin.email, role: 'admin', unreadCount },
    });
  } else if (user) {
    const { count } = await db.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.userId).eq('has_unread_user', true);
    unreadCount = count || 0;
    return NextResponse.json({
      user: { id: user.userId, name: user.name, email: user.email, role: 'customer', unreadCount },
    });
  }
}

