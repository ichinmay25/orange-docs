import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';

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
    select: { id: true, name: true, mcpToken: true },
  });
  if (!system) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const mcpServerPath = '/path/to/apps/mcp-server/dist/index.js';

  const config = {
    mcpServers: {
      [system.name.toLowerCase().replace(/\s+/g, '-')]: {
        command: 'node',
        args: [mcpServerPath],
        env: {
          MCP_API_BASE_URL: appUrl,
          MCP_TOKEN: system.mcpToken,
          MCP_SYSTEM_ID: system.id,
        },
      },
    },
  };

  return NextResponse.json({ config, mcpToken: system.mcpToken });
}
