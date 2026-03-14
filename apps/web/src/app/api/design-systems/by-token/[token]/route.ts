import { NextRequest, NextResponse } from 'next/server';
import { db } from '@designbase/db';

// Used by the MCP server to validate tokens and get system info
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const system = await db.designSystem.findUnique({
    where: { mcpToken: token },
    select: {
      id: true,
      name: true,
      lastSyncAt: true,
      syncStatus: true,
      _count: { select: { components: true, tokens: true } },
    },
  });

  if (!system) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  return NextResponse.json(system);
}
