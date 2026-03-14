import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { slugify } from '@/lib/utils';

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const systems = await db.designSystem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { components: true, tokens: true } },
    },
  });

  return NextResponse.json(systems);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    name: string;
    description?: string;
    figmaFileKey: string;
  };

  if (!body.name || !body.figmaFileKey) {
    return NextResponse.json({ error: 'name and figmaFileKey are required' }, { status: 400 });
  }

  const slug = slugify(body.name);

  const system = await db.designSystem.create({
    data: {
      userId: user.id,
      name: body.name,
      slug,
      description: body.description,
      figmaFileKey: body.figmaFileKey,
    },
  });

  return NextResponse.json(system, { status: 201 });
}
