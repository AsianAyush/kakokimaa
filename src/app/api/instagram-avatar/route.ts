import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.trim();
  if (!username) {
    return NextResponse.json({ url: null });
  }

  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({ url: null });
    }

    const html = await res.text();
    // Regex to match the og:image meta tag content
    const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    
    if (match && match[1]) {
      // Decode HTML entities if any
      const url = match[1].replace(/&amp;/g, '&');
      return NextResponse.json({ url });
    }

    return NextResponse.json({ url: null });
  } catch (err) {
    console.error('Avatar fetch error:', err);
    return NextResponse.json({ url: null });
  }
}
