import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Use Instagram's public search endpoint
    const res = await fetch(
      `https://www.instagram.com/web/search/topsearch/?query=${encodeURIComponent(q)}&context=user`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'https://www.instagram.com/',
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const users = (data?.users || []).slice(0, 6).map((u: { user: { username: string; full_name: string; profile_pic_url: string; is_verified: boolean; }}) => ({
      username: u.user.username,
      full_name: u.user.full_name,
      profile_pic_url: u.user.profile_pic_url,
      is_verified: u.user.is_verified,
    }));

    return NextResponse.json({ results: users });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
