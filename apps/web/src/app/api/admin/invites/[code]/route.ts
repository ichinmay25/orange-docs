import { NextRequest, NextResponse } from 'next/server';
import { db } from '@designbase/db';
import { isAdminRequest } from '@/lib/admin-auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.inviteCode.delete({ where: { code: params.code } });
  return new NextResponse(null, { status: 204 });
}
