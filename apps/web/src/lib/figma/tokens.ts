/**
 * Token extraction: Variables → Styles → Inferred (fallback chain).
 */

import type { FigmaClient, FigmaNode } from './client';
import type { TokenType, TokenSource } from '@designbase/types';
import { nameToSlug } from './extractor';

export interface ExtractedToken {
  type: TokenType;
  source: TokenSource;
  name: string;
  slug: string;
  value: string;
  rawValue?: unknown;
  hexValue?: string;
  figmaId?: string;
  figmaVariableCollectionId?: string;
  group?: string;
  description?: string;
}

// ── Styles ───────────────────────────────────────────────────────────────────

export async function extractTokensFromStyles(
  client: FigmaClient,
  fileKey: string
): Promise<ExtractedToken[]> {
  try {
    const stylesRes = await client.getStyles(fileKey);
    const styles = stylesRes.meta.styles;
    if (!styles.length) return [];

    const fillStyles = styles.filter(s => s.styleType === 'FILL');
    const textStyles = styles.filter(s => s.styleType === 'TEXT');

    if (!fillStyles.length && !textStyles.length) return [];

    const nodeIds = [...fillStyles, ...textStyles].map(s => s.node_id);
    const nodesRes = await client.getNodes(fileKey, nodeIds.slice(0, 100));

    const tokens: ExtractedToken[] = [];

    for (const style of fillStyles) {
      const nodeData = nodesRes.nodes[style.node_id];
      const node = nodeData?.document as FigmaNode | undefined;
      if (!node?.fills?.length) continue;

      const fill = node.fills.find(f => f.visible !== false && f.type === 'SOLID' && f.color);
      if (!fill?.color) continue;

      const c = fill.color;
      const hex = rgbaToHex(c.r, c.g, c.b, c.a);
      const humanValue = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${(c.a ?? 1).toFixed(2)})`;

      tokens.push({
        type: 'COLOR',
        source: 'FIGMA_STYLES',
        name: style.name,
        slug: nameToSlug(style.name),
        value: humanValue,
        rawValue: c,
        hexValue: hex,
        figmaId: style.key,
        description: style.description,
        group: style.name.includes('/') ? style.name.split('/')[0] : undefined,
      });
    }

    for (const style of textStyles) {
      const nodeData = nodesRes.nodes[style.node_id];
      const node = nodeData?.document as FigmaNode | undefined;
      if (!node?.style) continue;

      const s = node.style as Record<string, unknown>;
      tokens.push({
        type: 'TYPOGRAPHY',
        source: 'FIGMA_STYLES',
        name: style.name,
        slug: nameToSlug(style.name),
        value: `${s.fontFamily ?? ''} ${s.fontSize ?? ''}px/${s.lineHeightPx ?? ''}px`,
        rawValue: s,
        figmaId: style.key,
        description: style.description,
        group: style.name.includes('/') ? style.name.split('/')[0] : undefined,
      });
    }

    return tokens;
  } catch {
    return [];
  }
}

// ── Inferred ─────────────────────────────────────────────────────────────────

export function extractTokensInferred(components: Array<{ nodeTree: unknown }>): ExtractedToken[] {
  const colorMap = new Map<string, { r: number; g: number; b: number; a: number }>();

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;

    const fills = n.fills as Array<{ type: string; visible?: boolean; color?: { r: number; g: number; b: number; a: number }; opacity?: number }> | undefined;
    if (fills) {
      for (const fill of fills) {
        if (fill.visible !== false && fill.type === 'SOLID' && fill.color) {
          const hex = rgbaToHex(fill.color.r, fill.color.g, fill.color.b, fill.color.a);
          colorMap.set(hex, fill.color);
        }
      }
    }

    if (Array.isArray(n.children)) {
      for (const child of n.children) walk(child);
    }
  }

  for (const comp of components) {
    walk(comp.nodeTree);
  }

  return Array.from(colorMap.entries()).map(([hex, c]) => {
    const humanValue = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${(c.a ?? 1).toFixed(2)})`;
    return {
      type: 'COLOR' as TokenType,
      source: 'INFERRED' as TokenSource,
      name: `Color ${hex.toUpperCase()}`,
      slug: `color-${hex.replace('#', '')}`,
      value: humanValue,
      rawValue: c,
      hexValue: hex,
    };
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rgbaToHex(r: number, g: number, b: number, a = 1): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a < 1 ? `${hex}${toHex(a)}` : hex;
}

function inferNumericType(name: string, value: number): TokenType {
  const lower = name.toLowerCase();
  if (lower.includes('radius') || lower.includes('corner')) return 'RADIUS';
  if (lower.includes('space') || lower.includes('gap') || lower.includes('padding') || lower.includes('margin')) return 'SPACING';
  if (lower.includes('opacity')) return 'OPACITY';
  if (value % 4 === 0 && value <= 128) return 'SPACING';
  return 'OTHER';
}
