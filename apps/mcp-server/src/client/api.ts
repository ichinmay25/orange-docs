/**
 * HTTP client that talks to the Next.js web app API.
 * The MCP server never touches the database directly.
 */

const API_BASE = process.env.MCP_API_BASE_URL ?? 'http://localhost:3000';
const MCP_TOKEN = process.env.MCP_TOKEN ?? '';
const SYSTEM_ID = process.env.MCP_SYSTEM_ID ?? '';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${MCP_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── API helpers ──────────────────────────────────────────────────────────────

export async function getSystemInfo() {
  return apiFetch<{
    id: string;
    name: string;
    lastSyncAt: string | null;
    syncStatus: string;
    _count: { components: number; tokens: number };
  }>(`/api/design-systems/by-token/${MCP_TOKEN}`);
}

export async function listComponents(category?: string) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch<Array<{
    id: string;
    slug: string;
    name: string;
    categoryId: string | null;
    category: { name: string } | null;
    figmaDescription: string | null;
    thumbnailUrl: string | null;
  }>>(`/api/design-systems/${SYSTEM_ID}/components${qs}`);
}

export async function getComponent(slug: string) {
  return apiFetch<{
    id: string;
    slug: string;
    name: string;
    figmaDescription: string | null;
    docDescription: unknown | null;
    docUsageNotes: unknown | null;
    dos: string[];
    donts: string[];
    variants: unknown[] | null;
    figmaProps: Record<string, unknown> | null;
    thumbnailUrl: string | null;
    category: { name: string } | null;
  }>(`/api/design-systems/${SYSTEM_ID}/components/${slug}`);
}

export async function searchComponents(query: string) {
  return apiFetch<Array<{
    slug: string;
    name: string;
    figmaDescription: string | null;
    category: { name: string } | null;
  }>>(`/api/design-systems/${SYSTEM_ID}/components?search=${encodeURIComponent(query)}&limit=10`);
}

export async function getTokens(type?: string) {
  const qs = type && type !== 'ALL' ? `?type=${encodeURIComponent(type)}` : '';
  return apiFetch<Array<{
    id: string;
    slug: string;
    name: string;
    type: string;
    value: string;
    hexValue: string | null;
    group: string | null;
    description: string | null;
  }>>(`/api/design-systems/${SYSTEM_ID}/tokens${qs}`);
}
