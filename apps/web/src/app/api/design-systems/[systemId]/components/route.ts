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

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const hidden = searchParams.get('hidden') === 'true';

  const components = await db.component.findMany({
    where: {
      designSystemId: systemId,
      isHidden: hidden ? undefined : false,
      ...(category && {
        category: { name: { equals: category, mode: 'insensitive' } },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { figmaDescription: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    take: limit,
  });

  return NextResponse.json(components);
}
