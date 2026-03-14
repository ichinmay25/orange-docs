import { NextRequest, NextResponse } from 'next/server';
import { db } from '@designbase/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publishSlug: string }> }
) {
  const { publishSlug } = await params;

  const system = await db.designSystem.findFirst({
    where: { publishSlug, isPublished: true },
    include: {
      components: {
        where: { isHidden: false },
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
      tokens: {
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      },
      categories: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
    },
  });

  if (!system) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    name: system.name,
    description: system.description,
    lastSyncAt: system.lastSyncAt,
    components: system.components,
    tokens: system.tokens,
    categories: system.categories,
  });
}
