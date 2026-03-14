import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { Plus, Layers, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const syncStatusConfig = {
  IDLE: { label: 'Not synced', icon: Clock, className: 'text-gray-400' },
  SYNCING: { label: 'Syncing...', icon: Loader2, className: 'text-blue-500 animate-spin' },
  DONE: { label: 'Synced', icon: CheckCircle2, className: 'text-green-500' },
  ERROR: { label: 'Sync failed', icon: AlertCircle, className: 'text-red-500' },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const systems = await db.designSystem.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { components: true, tokens: true } } },
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Design Systems</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your Figma-connected design systems</p>
        </div>
        <Link
          href="/design-systems/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New design system
        </Link>
      </div>

      {systems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">No design systems yet</h3>
          <p className="text-sm text-gray-500 mb-4">Connect a Figma file to get started</p>
          <Link
            href="/design-systems/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first design system
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systems.map((system: typeof systems[number]) => {
            const status = syncStatusConfig[system.syncStatus];
            const StatusIcon = status.icon;
            return (
              <Link
                key={system.id}
                href={`/design-systems/${system.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">{system.name}</h2>
                    {system.description && (
                      <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{system.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <StatusIcon className={`w-3.5 h-3.5 ${status.className}`} />
                    <span className="text-gray-500">{status.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span><strong className="text-gray-900">{system._count.components}</strong> components</span>
                  <span><strong className="text-gray-900">{system._count.tokens}</strong> tokens</span>
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  Last synced: {formatDate(system.lastSyncAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
