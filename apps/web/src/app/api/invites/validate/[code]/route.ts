import { NextRequest, NextResponse } from 'next/server';
import { db } from '@designbase/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const invite = await db.inviteCode.findUnique({ where: { code: params.code } });

  if (!invite) {
    return NextResponse.json({ valid: false, reason: 'not_found' });
  }
  if (invite.usedBy) {
    return NextResponse.json({ valid: false, reason: 'already_used' });
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, reason: 'expired' });
  }

  return NextResponse.json({ valid: true });
}
