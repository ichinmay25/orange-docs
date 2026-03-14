import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FIGMA_OAUTH_URL = 'https://www.figma.com/oauth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = new URLSearchParams({
    client_id: process.env.FIGMA_CLIENT_ID!,
    redirect_uri: process.env.FIGMA_REDIRECT_URI!,
    scope: 'file_content:read,file_metadata:read',
    response_type: 'code',
    state: user.id,
  });

  return NextResponse.redirect(`${FIGMA_OAUTH_URL}?${params}`);
}
