import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db, Prisma } from '@designbase/db';

async function findComponent(systemId: string, componentId: string, userId: string) {
  const system = await db.designSystem.findFirst({
    where: { id: systemId, userId },
    select: { id: true },
  });
  if (!system) return null;

  // componentId can be either a DB id or a slug
  return db.component.findFirst({
    where: {
      designSystemId: systemId,
      OR: [{ id: componentId }, { slug: componentId }],
    },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ systemId: string; componentId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { systemId, componentId } = await params;
  const component = await findComponent(systemId, componentId, user.id);
  if (!component) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(component);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string; componentId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { systemId, componentId } = await params;
  const component = await findComponent(systemId, componentId, user.id);
  if (!component) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json() as {
    docDescription?: unknown;
    docUsageNotes?: unknown;
    dos?: string[];
    donts?: string[];
    categoryId?: string | null;
    isHidden?: boolean;
    sortOrder?: number;
    customProps?: Array<{ key: string; value: string }>;
  };

  const toJson = (v: unknown) =>
    v === null ? Prisma.JsonNull : (v as Prisma.InputJsonValue);

  const updated = await db.component.update({
    where: { id: component.id },
    data: {
      ...(body.docDescription !== undefined && { docDescription: toJson(body.docDescription) }),
      ...(body.docUsageNotes !== undefined && { docUsageNotes: toJson(body.docUsageNotes) }),
      ...(body.dos !== undefined && { dos: body.dos }),
      ...(body.donts !== undefined && { donts: body.donts }),
      ...(body.categoryId !== undefined && {
        category: body.categoryId === null
          ? { disconnect: true }
          : { connect: { id: body.categoryId } },
      }),
      ...(body.isHidden !== undefined && { isHidden: body.isHidden }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.customProps !== undefined && { customProps: body.customProps }),
    },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json(updated);
}
