import { NextRequest, NextResponse } from 'next/server';
import { db } from '@designbase/db';
import { isAdminRequest } from '@/lib/admin-auth';
import { randomBytes } from 'crypto';

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const codes = await db.inviteCode.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 20);
  const note: string | undefined = body.note || undefined;
  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + Number(body.expiresInDays) * 86400_000)
    : undefined;

  const created = await Promise.all(
    Array.from({ length: count }).map(() =>
      db.inviteCode.create({
        data: {
          code: randomBytes(6).toString('hex'),
          note,
          expiresAt,
        },
      })
    )
  );

  return NextResponse.json(created, { status: 201 });
}
