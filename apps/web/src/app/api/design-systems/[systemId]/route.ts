import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { slugify } from '@/lib/utils';

async function getSystem(systemId: string, userId: string) {
  return db.designSystem.findFirst({
    where: { id: systemId, userId },
  });
}

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
    include: { _count: { select: { components: true, tokens: true } } },
  });
  if (!system) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(system);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { systemId } = await params;
  const system = await getSystem(systemId, user.id);
  if (!system) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json() as {
    name?: string;
    description?: string;
    isPublished?: boolean;
    publishSlug?: string;
  };

  const updated = await db.designSystem.update({
    where: { id: systemId },
    data: {
      ...(body.name && { name: body.name, slug: slugify(body.name) }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
      ...(body.publishSlug !== undefined && { publishSlug: body.publishSlug || null }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { systemId } = await params;
  const system = await getSystem(systemId, user.id);
  if (!system) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.designSystem.delete({ where: { id: systemId } });
  return NextResponse.json({ success: true });
}
