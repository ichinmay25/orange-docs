import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { SystemNavTabs } from '@/components/design-systems/SystemNavTabs';

export default async function SystemLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ systemId: string }>;
}) {
  const { systemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const system = await db.designSystem.findFirst({
    where: { id: systemId, userId: user!.id },
    select: { id: true, name: true, slug: true },
  });

  if (!system) notFound();

  return (
    <div className="flex flex-col h-full">
      {/* System header */}
      <div className="bg-white border-b border-gray-200 px-8 pt-6 pb-0">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{system.name}</span>
        </div>
        <SystemNavTabs systemId={system.id} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
