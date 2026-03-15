/**
 * FigmaClient — thin wrapper around the Figma REST API.
 * Handles token refresh (if within 5 min of expiry).
 */

import { db } from '@designbase/db';
import { decrypt, encrypt } from '@/lib/crypto';

const FIGMA_API = 'https://api.figma.com';
const FIGMA_TOKEN_URL = 'https://api.figma.com/v1/oauth/token';

export class FigmaClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${FIGMA_API}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Figma API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  async getFile(fileKey: string, depth = 1) {
    return this.request<{ name: string; lastModified: string; document: FigmaDocument }>(
      `/v1/files/${fileKey}`,
      { depth: String(depth) }
    );
  }

  async getFullFile(fileKey: string) {
    return this.request<{ name: string; lastModified: string; document: FigmaDocument }>(
      `/v1/files/${fileKey}`,
      { geometry: 'omit' }
    );
  }

  async getVariables(fileKey: string) {
    return this.request<{ meta: { variables: Record<string, FigmaVariable>; variableCollections: Record<string, FigmaVariableCollection> } }>(
      `/v1/files/${fileKey}/variables/local`
    );
  }

  async getStyles(fileKey: string) {
    return this.request<{ meta: { styles: FigmaStyle[] } }>(
      `/v1/files/${fileKey}/styles`
    );
  }

  async getNodes(fileKey: string, nodeIds: string[]) {
    return this.request<{ nodes: Record<string, { document: FigmaNode }> }>(
      `/v1/files/${fileKey}/nodes`,
      { ids: nodeIds.join(',') }
    );
  }

  async getImageUrls(fileKey: string, nodeIds: string[], format: 'png' | 'svg' = 'png', scale = 2) {
    return this.request<{ images: Record<string, string | null> }>(
      `/v1/images/${fileKey}`,
      { ids: nodeIds.join(','), format, scale: String(scale) }
    );
  }
}

// ── Token management ─────────────────────────────────────────────────────────

export async function getFigmaClientForUser(userId: string): Promise<FigmaClient> {
  const connection = await db.figmaConnection.findUnique({ where: { userId } });
  if (!connection) throw new Error('No Figma connection found');

  // Refresh if within 5 minutes of expiry
  const expiresAt = connection.expiresAt.getTime();
  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;

  if (expiresAt - now < FIVE_MIN) {
    const refreshToken = await decrypt(connection.refreshToken);
    const params = new URLSearchParams({
      client_id: process.env.FIGMA_CLIENT_ID!,
      client_secret: process.env.FIGMA_CLIENT_SECRET!,
      redirect_uri: process.env.FIGMA_REDIRECT_URI!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const res = await fetch(FIGMA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (res.ok) {
      const data = await res.json() as { access_token: string; refresh_token?: string; expires_in: number };
      const newAccess = await encrypt(data.access_token);
      const newRefresh = data.refresh_token
        ? await encrypt(data.refresh_token)
        : connection.refreshToken;

      await db.figmaConnection.update({
        where: { userId },
        data: {
          accessToken: newAccess,
          refreshToken: newRefresh,
          expiresAt: new Date(Date.now() + data.expires_in * 1000),
        },
      });

      return new FigmaClient(data.access_token);
    } else {
      const body = await res.text().catch(() => '');
      console.error(`[figma] token refresh failed (${res.status}): ${body}`);
      // If the token is already expired, don't attempt the API call with a dead token
      if (expiresAt < now) {
        throw new Error('Figma access token expired and refresh failed — please reconnect Figma in Settings');
      }
    }
  }

  const accessToken = (await decrypt(connection.accessToken)).trim();
  console.log('[figma] token prefix:', accessToken.slice(0, 8), 'length:', accessToken.length);
  return new FigmaClient(accessToken);
}

// ── Figma API types ───────────────────────────────────────────────────────────

export interface FigmaDocument {
  id: string;
  name: string;
  type: string;
  children: FigmaNode[];
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  description?: string;
  componentPropertyDefinitions?: Record<string, FigmaPropDefinition>;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: FigmaFillNode[];
  strokes?: FigmaFillNode[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  opacity?: number;
  clipsContent?: boolean;
  effects?: FigmaEffectNode[];
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  characters?: string;
  style?: Record<string, unknown>;
}

export interface FigmaFillNode {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: { r: number; g: number; b: number; a: number };
  gradientStops?: Array<{ color: { r: number; g: number; b: number; a: number }; position: number }>;
}

export interface FigmaEffectNode {
  type: string;
  visible?: boolean;
  radius?: number;
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  spread?: number;
}

export interface FigmaPropDefinition {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  defaultValue: unknown;
  variantOptions?: string[];
}

export interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, unknown>;
  variableCollectionId: string;
  description?: string;
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description?: string;
  node_id: string;
}
