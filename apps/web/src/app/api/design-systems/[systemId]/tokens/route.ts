import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { systemId } = await params;
  const system = await db.designSystem.findFirst({
    where: { id: systemId, userId: user.id },
    select: { id: true },
  });
  if (!system) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const typeParam = request.nextUrl.searchParams.get('type');
  const tokens = await db.token.findMany({
    where: {
      designSystemId: systemId,
      ...(typeParam && typeParam !== 'ALL' && { type: typeParam as never }),
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json(tokens);
}
