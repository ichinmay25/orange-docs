'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Copy, Check, Globe, Lock } from 'lucide-react';

interface MCPConfig {
  config: Record<string, unknown>;
  mcpToken: string;
}

export default function SystemSettingsPage() {
  const params = useParams<{ systemId: string }>();
  const [mcpConfig, setMcpConfig] = useState<MCPConfig | null>(null);
  const [isPublished, setIsPublished] = useState<boolean | null>(null);
  const [publishSlug, setPublishSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/design-systems/${params.systemId}/mcp-config`)
      .then(r => r.json())
      .then((data: MCPConfig) => setMcpConfig(data));

    fetch(`/api/design-systems/${params.systemId}`)
      .then(r => r.json())
      .then((data: { isPublished: boolean; publishSlug: string | null }) => {
        setIsPublished(data.isPublished);
        setPublishSlug(data.publishSlug ?? '');
      });
  }, [params.systemId]);

  async function copyToken() {
    if (!mcpConfig) return;
    await navigator.clipboard.writeText(mcpConfig.mcpToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyConfig() {
    if (!mcpConfig) return;
    await navigator.clipboard.writeText(JSON.stringify(mcpConfig.config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function savePublishSettings() {
    setSaving(true);
    await fetch(`/api/design-systems/${params.systemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished, publishSlug: publishSlug || null }),
    });
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Design system settings</h2>

      {/* Publish */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          {isPublished ? (
            <Globe className="w-5 h-5 text-green-500" />
          ) : (
            <Lock className="w-5 h-5 text-gray-400" />
          )}
          <h3 className="font-semibold text-gray-900">Public styleguide</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished ?? false}
              onChange={e => setIsPublished(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Make this design system publicly accessible</span>
          </label>

          {isPublished && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Public URL slug</label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500">
                  /ds/
                </span>
                <input
                  type="text"
                  value={publishSlug}
                  onChange={e => setPublishSlug(e.target.value)}
                  placeholder="my-design-system"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
                />
              </div>
              {publishSlug && (
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/ds/${publishSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline font-mono"
                  >
                    {`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/ds/${publishSlug}`}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/ds/${publishSlug}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={savePublishSettings}
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>

      {/* MCP Config */}
      {mcpConfig && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">MCP server config</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add this to your <code className="bg-gray-100 px-1 rounded">claude_desktop_config.json</code> to use with Claude Desktop.
          </p>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">MCP Token</label>
              <button
                onClick={copyToken}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <code className="block text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 break-all font-mono">
              {mcpConfig.mcpToken}
            </code>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Config JSON</label>
              <button
                onClick={copyConfig}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700 overflow-auto max-h-60 font-mono">
              {JSON.stringify(mcpConfig.config, null, 2)}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}
