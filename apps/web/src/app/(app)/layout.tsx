import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { db } from '@designbase/db';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Ensure user exists in DB (first time after OAuth)
  await db.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    update: {},
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={{ email: user.email!, avatarUrl: user.user_metadata?.avatar_url }} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
