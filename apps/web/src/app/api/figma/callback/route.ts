import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { encrypt } from '@/lib/crypto';

const FIGMA_TOKEN_URL = 'https://api.figma.com/v1/oauth/token';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // userId
  const error = url.searchParams.get('error');

  if (error || !code || !state) {
    return NextResponse.redirect(
      new URL('/settings?figma=error', request.url)
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(FIGMA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.FIGMA_CLIENT_ID!,
        client_secret: process.env.FIGMA_CLIENT_SECRET!,
        redirect_uri: process.env.FIGMA_REDIRECT_URI!,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_id?: string;
      email?: string;
      handle?: string;
    };

    // Fetch user info if not included in token response
    const meRes = await fetch('https://api.figma.com/v1/me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    const meData = meRes.ok
      ? await meRes.json() as { id: string; email: string; handle: string }
      : { id: String(tokenData.user_id ?? ''), email: tokenData.email ?? '', handle: tokenData.handle ?? '' };

    // Encrypt tokens before storing
    const [encAccessToken, encRefreshToken] = await Promise.all([
      encrypt(tokenData.access_token),
      encrypt(tokenData.refresh_token),
    ]);

    await db.figmaConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        accessToken: encAccessToken,
        refreshToken: encRefreshToken,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        figmaUserId: meData.id,
        figmaEmail: meData.email,
        figmaHandle: meData.handle,
      },
      update: {
        accessToken: encAccessToken,
        refreshToken: encRefreshToken,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        figmaUserId: meData.id,
        figmaEmail: meData.email,
        figmaHandle: meData.handle,
      },
    });

    return NextResponse.redirect(new URL('/settings?figma=connected', request.url));
  } catch (err) {
    console.error('Figma callback error:', err);
    return NextResponse.redirect(new URL('/settings?figma=error', request.url));
  }
}
