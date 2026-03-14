'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { SyncStatus } from '@designbase/types';

interface SyncButtonProps {
  systemId: string;
  syncStatus: SyncStatus;
  onSyncComplete?: () => void;
}

export function SyncButton({ systemId, syncStatus: initialStatus, onSyncComplete }: SyncButtonProps) {
  const [status, setStatus] = useState<SyncStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  const pollStatus = useCallback(async () => {
    const res = await fetch(`/api/design-systems/${systemId}/sync`);
    if (res.ok) {
      const data = await res.json() as { syncStatus: SyncStatus };
      setStatus(data.syncStatus);
      if (data.syncStatus !== 'SYNCING') {
        onSyncComplete?.();
        return true; // done
      }
    }
    return false;
  }, [systemId, onSyncComplete]);

  useEffect(() => {
    if (status !== 'SYNCING') return;
    const interval = setInterval(async () => {
      const done = await pollStatus();
      if (done) clearInterval(interval);
    }, 2000);
    return () => clearInterval(interval);
  }, [status, pollStatus]);

  async function handleSync() {
    setLoading(true);
    setStatus('SYNCING');
    try {
      await fetch(`/api/design-systems/${systemId}/sync`, { method: 'POST' });
    } finally {
      setLoading(false);
    }
  }

  const isSyncing = status === 'SYNCING' || loading;

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
    >
      {isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Syncing...
        </>
      ) : status === 'DONE' ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          Sync now
        </>
      ) : status === 'ERROR' ? (
        <>
          <AlertCircle className="w-4 h-4 text-red-400" />
          Retry sync
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          Sync now
        </>
      )}
    </button>
  );
}
