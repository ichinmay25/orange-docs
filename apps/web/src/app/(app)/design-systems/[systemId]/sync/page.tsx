import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { SyncButton } from '@/components/sync/SyncButton';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';

const statusIcons = {
  DONE: CheckCircle2,
  ERROR: AlertCircle,
  SYNCING: Loader2,
  IDLE: Clock,
};

const statusColors = {
  DONE: 'text-green-500',
  ERROR: 'text-red-500',
  SYNCING: 'text-blue-500',
  IDLE: 'text-gray-400',
};

export default async function SyncPage({
  params,
}: {
  params: Promise<{ systemId: string }>;
}) {
  const { systemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const system = await db.designSystem.findFirst({
    where: { id: systemId, userId: user!.id },
    select: { id: true, syncStatus: true },
  });
  if (!system) notFound();

  const syncs = await db.figmaSync.findMany({
    where: { designSystemId: systemId },
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Sync history</h2>
        <SyncButton systemId={system.id} syncStatus={system.syncStatus} />
      </div>

      {syncs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">No syncs yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {syncs.map(sync => {
            const Icon = statusIcons[sync.status];
            const color = statusColors[sync.status];
            return (
              <div key={sync.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color} ${sync.status === 'SYNCING' ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium text-gray-900 capitalize">{sync.status.toLowerCase()}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(sync.startedAt)}</span>
                </div>

                {sync.status === 'DONE' && (
                  <div className="flex gap-4 text-xs text-gray-500 pl-6">
                    <span>{sync.componentsFound ?? 0} components</span>
                    <span>{sync.tokensFound ?? 0} tokens</span>
                    <span>{sync.thumbnailsUploaded ?? 0} thumbnails</span>
                    {sync.finishedAt && (
                      <span>
                        {Math.round((sync.finishedAt.getTime() - sync.startedAt.getTime()) / 1000)}s
                      </span>
                    )}
                  </div>
                )}

                {sync.status === 'ERROR' && sync.errorMessage && (
                  <p className="pl-6 text-xs text-red-600 mt-1 bg-red-50 rounded p-2">
                    {sync.errorMessage}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
