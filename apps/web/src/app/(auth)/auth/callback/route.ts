import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { db } from '@designbase/db';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', request.url));
  }

  // Check if user already exists in our DB
  const existing = await db.user.findUnique({ where: { id: user.id } });
  if (existing) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  // New user — require a valid invite code
  const cookieStore = await cookies();
  const inviteCode = cookieStore.get('invite_code')?.value;

  if (!inviteCode) {
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return NextResponse.redirect(new URL('/login?error=invite_required', request.url));
  }

  const invite = await db.inviteCode.findUnique({ where: { code: inviteCode } });

  const isValid =
    invite &&
    !invite.usedBy &&
    (!invite.expiresAt || invite.expiresAt > new Date());

  if (!isValid) {
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    const response = NextResponse.redirect(new URL('/login?error=invite_required', request.url));
    response.cookies.delete('invite_code');
    return response;
  }

  // Create user in DB and mark invite as used
  await db.$transaction([
    db.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
    }),
    db.inviteCode.update({
      where: { code: inviteCode },
      data: { usedBy: user.id, usedAt: new Date() },
    }),
  ]);

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.delete('invite_code');
  return response;
}
