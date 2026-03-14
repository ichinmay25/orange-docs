import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure user row exists in DB
      await db.user.upsert({
        where: { id: data.user.id },
        create: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name ?? null,
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
        },
        update: {
          email: data.user.email!,
          name: data.user.user_metadata?.full_name ?? null,
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
        },
      });

      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback', request.url));
}
