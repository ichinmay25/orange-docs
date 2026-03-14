import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { runFigmaSync } from '@/lib/sync/orchestrator';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { systemId } = await params;
  const system = await db.designSystem.findFirst({
    where: { id: systemId, userId: user.id },
  });
  if (!system) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (system.syncStatus === 'SYNCING') {
    return NextResponse.json({ error: 'Sync already in progress' }, { status: 409 });
  }

  // Fire and forget — return immediately, client polls GET /sync
  runFigmaSync(systemId).catch(err => {
    console.error(`Sync failed for ${systemId}:`, err);
  });

  return NextResponse.json({ status: 'SYNCING' });
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
    select: { syncStatus: true, lastSyncAt: true },
  });
  if (!system) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(system);
}
