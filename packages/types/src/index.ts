// ── Shared types across the monorepo ────────────────────────────────────────

export type SyncStatus = 'IDLE' | 'SYNCING' | 'DONE' | 'ERROR';
export type TokenType = 'COLOR' | 'TYPOGRAPHY' | 'SPACING' | 'RADIUS' | 'SHADOW' | 'OPACITY' | 'OTHER';
export type TokenSource = 'FIGMA_VARIABLES' | 'FIGMA_STYLES' | 'INFERRED';

export interface FigmaNodeTree {
  type: string;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  fills?: FigmaFill[];
  strokes?: FigmaFill[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  opacity?: number;
  clipsContent?: boolean;
  effects?: FigmaEffect[];
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  characters?: string;
  textStyle?: FigmaTextStyle;
  children?: FigmaNodeTree[];
}

export interface FigmaFill {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: { r: number; g: number; b: number; a: number };
  gradientStops?: Array<{ color: { r: number; g: number; b: number; a: number }; position: number }>;
}

export interface FigmaEffect {
  type: string;
  visible?: boolean;
  radius?: number;
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  spread?: number;
}

export interface FigmaTextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textCase?: string;
  textDecoration?: string;
}

export interface ComponentVariant {
  id: string;
  name: string;
  properties: Record<string, string>;
  children?: FigmaNodeTree[];
}

export interface ComponentListItem {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
  thumbnailUrl: string | null;
  figmaDescription: string | null;
  isHidden: boolean;
  sortOrder: number;
}

export interface ComponentDetail {
  id: string;
  slug: string;
  name: string;
  figmaNodeId: string;
  figmaNodeType: string;
  figmaPageName: string | null;
  figmaDescription: string | null;
  variants: ComponentVariant[] | null;
  figmaProps: Record<string, unknown> | null;
  nodeTree: FigmaNodeTree | null;
  thumbnailUrl: string | null;
  docDescription: unknown | null;
  docUsageNotes: unknown | null;
  dos: string[];
  donts: string[];
  customProps: Array<{ key: string; value: string }> | null;
  isHidden: boolean;
  sortOrder: number;
  categoryId: string | null;
  designSystemId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenItem {
  id: string;
  slug: string;
  name: string;
  type: TokenType;
  source: TokenSource;
  value: string;
  rawValue: unknown | null;
  hexValue: string | null;
  group: string | null;
  description: string | null;
}

export interface DesignSystemListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  figmaFileName: string | null;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  isPublished: boolean;
  publishSlug: string | null;
  _count: { components: number; tokens: number };
}

export interface MCPComponentSummary {
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
}

export interface MCPComponentDetail {
  slug: string;
  name: string;
  description: string | null;
  usageNotes: string | null;
  dos: string[];
  donts: string[];
  variants: ComponentVariant[] | null;
  figmaProps: Record<string, unknown> | null;
  thumbnailUrl: string | null;
}
