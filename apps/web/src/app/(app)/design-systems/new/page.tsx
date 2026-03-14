'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function parseFigmaKey(input: string): string | null {
  const match = input.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : input.trim() || null;
}

export default function NewDesignSystemPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [figmaInput, setFigmaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const figmaFileKey = parseFigmaKey(figmaInput);
    if (!figmaFileKey) {
      setError('Please enter a valid Figma file URL or key');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/design-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, figmaFileKey }),
      });

      if (!res.ok) {
        const data = await res.json() as { error: string };
        throw new Error(data.error);
      }

      const system = await res.json() as { id: string };
      router.push(`/design-systems/${system.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create design system');
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">New design system</h1>
      <p className="text-sm text-gray-500 mb-8">Connect a Figma file to start managing your design system</p>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-gray-200 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="My Design System"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="A brief description of your design system"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Figma file URL or key
          </label>
          <input
            type="text"
            value={figmaInput}
            onChange={e => setFigmaInput(e.target.value)}
            required
            placeholder="https://www.figma.com/design/ABC123/... or ABC123"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono"
          />
          <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Paste the URL from your browser when viewing the Figma file
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !name || !figmaInput}
            className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create design system'}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-medium text-amber-800 mb-1">Connect Figma first</p>
        <p className="text-xs text-amber-700">
          You need a Figma OAuth connection to sync components.{' '}
          <Link href="/settings" className="underline font-medium">
            Connect Figma in Settings &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
