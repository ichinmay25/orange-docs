import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  // Bearer token check (for API access)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token && token === process.env.ADMIN_SECRET) return true;
  }

  // Authenticated user email check
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === adminEmail;
}
