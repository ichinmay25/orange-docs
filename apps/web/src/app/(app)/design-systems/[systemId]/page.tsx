import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { SyncButton } from '@/components/sync/SyncButton';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Clock, Layers, Palette } from 'lucide-react';

export default async function SystemOverviewPage({
  params,
}: {
  params: Promise<{ systemId: string }>;
}) {
  const { systemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const system = await db.designSystem.findFirst({
    where: { id: systemId, userId: user!.id },
    include: {
      _count: { select: { components: true, tokens: true } },
      syncs: {
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!system) notFound();

  const lastSync = system.syncs[0];

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{system.name}</h1>
          {system.description && (
            <p className="mt-1 text-sm text-gray-500">{system.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-400 font-mono">{system.figmaFileKey}</p>
        </div>
        <SyncButton systemId={system.id} syncStatus={system.syncStatus} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Layers className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-500">Components</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{system._count.components}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Palette className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm text-gray-500">Tokens</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{system._count.tokens}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Last sync</h2>
        {lastSync ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {lastSync.status === 'DONE' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {lastSync.status === 'ERROR' && <AlertCircle className="w-4 h-4 text-red-500" />}
              {lastSync.status === 'SYNCING' && <Clock className="w-4 h-4 text-blue-500" />}
              {lastSync.status === 'IDLE' && <Clock className="w-4 h-4 text-gray-400" />}
              <span className="text-gray-700 capitalize">{lastSync.status.toLowerCase()}</span>
              <span className="text-gray-400">&middot;</span>
              <span className="text-gray-500">{formatDate(lastSync.startedAt)}</span>
            </div>
            {lastSync.status === 'DONE' && (
              <div className="flex gap-4 text-gray-500 pl-6">
                <span>{lastSync.componentsFound} components</span>
                <span>{lastSync.tokensFound} tokens</span>
                <span>{lastSync.thumbnailsUploaded} thumbnails</span>
              </div>
            )}
            {lastSync.status === 'ERROR' && lastSync.errorMessage && (
              <p className="pl-6 text-red-600 text-xs bg-red-50 rounded p-2">{lastSync.errorMessage}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No syncs yet. Click &quot;Sync now&quot; to import your Figma components.</p>
        )}
      </div>
    </div>
  );
}
