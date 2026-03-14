import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { FigmaConnectButton } from '@/components/settings/FigmaConnectButton';
import { CheckCircle2, User } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const figmaConnection = await db.figmaConnection.findUnique({
    where: { userId: user!.id },
    select: { figmaEmail: true, figmaHandle: true, updatedAt: true },
  });

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Account */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Account</h2>
        </div>
        <div className="text-sm text-gray-600">
          <p><span className="text-gray-400">Email:</span> {user!.email}</p>
        </div>
      </section>

      {/* Figma */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Figma connection</h2>
            <p className="text-sm text-gray-500 mt-0.5">Required for syncing components and tokens</p>
          </div>
        </div>

        {figmaConnection ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Connected as <strong>{figmaConnection.figmaHandle ?? figmaConnection.figmaEmail}</strong></span>
            </div>
            <FigmaConnectButton connected />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Connect your Figma account to enable syncing.</p>
            <FigmaConnectButton connected={false} />
          </div>
        )}
      </section>
    </div>
  );
}
