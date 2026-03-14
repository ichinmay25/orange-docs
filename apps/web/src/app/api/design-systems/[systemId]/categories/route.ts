import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { slugify } from '@/lib/utils';

export async function GET(
  _req: NextRequest,
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

  const categories = await db.category.findMany({
    where: { designSystemId: systemId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { components: true } } },
  });

  return NextResponse.json(categories);
}

export async function POST(
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

  const body = await request.json() as { name: string; description?: string };
  if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const category = await db.category.create({
    data: {
      designSystemId: systemId,
      name: body.name,
      slug: slugify(body.name),
      description: body.description,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
