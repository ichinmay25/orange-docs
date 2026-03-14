'use client';

import { useState } from 'react';

interface InviteCode {
  id: string;
  code: string;
  note: string | null;
  usedBy: string | null;
  usedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

function getStatus(code: InviteCode): 'used' | 'expired' | 'active' {
  if (code.usedBy) return 'used';
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) return 'expired';
  return 'active';
}

const statusBadge: Record<string, string> = {
  used: 'bg-gray-100 text-gray-600',
  expired: 'bg-yellow-50 text-yellow-700',
  active: 'bg-green-50 text-green-700',
};

export function InviteManager({ initialCodes }: { initialCodes: InviteCode[] }) {
  const [codes, setCodes] = useState<InviteCode[]>(initialCodes);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  async function generate() {
    setGenerating(true);
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count,
        note: note || undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      }),
    });
    const created: InviteCode[] = await res.json();
    setCodes(prev => [...created, ...prev]);
    setNote('');
    setExpiresInDays('');
    setGenerating(false);
  }

  async function revoke(code: string) {
    await fetch(`/api/admin/invites/${code}`, { method: 'DELETE' });
    setCodes(prev => prev.filter(c => c.code !== code));
  }

  function copyUrl(code: string) {
    navigator.clipboard.writeText(`${appUrl}/invite/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Invite Codes</h1>

      {/* Generate form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Generate Codes</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quantity (1–20)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. for Sarah"
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expires in days (optional)</label>
            <input
              type="number"
              min={1}
              value={expiresInDays}
              onChange={e => setExpiresInDays(e.target.value)}
              placeholder="never"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Codes table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Code</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Note</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Expires</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8 text-sm">
                  No invite codes yet.
                </td>
              </tr>
            )}
            {codes.map(c => {
              const status = getStatus(c);
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-800">{c.code}</td>
                  <td className="px-4 py-3 text-gray-500">{c.note ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[status]}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {status === 'active' && (
                        <button
                          onClick={() => copyUrl(c.code)}
                          className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                        >
                          {copied === c.code ? 'Copied!' : 'Copy URL'}
                        </button>
                      )}
                      <button
                        onClick={() => revoke(c.code)}
                        className="text-xs px-2.5 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
