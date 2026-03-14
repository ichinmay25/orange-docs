/**
 * Ported from ~/Desktop/figma-mcp/sync.js
 * Extracts node trees and components from Figma document.
 */

import type { FigmaNode, FigmaDocument } from './client';

export interface ExtractedComponent {
  figmaNodeId: string;
  figmaNodeType: 'COMPONENT' | 'COMPONENT_SET';
  figmaPageName: string;
  name: string;
  figmaDescription: string;
  figmaProps: Record<string, unknown>;
  variants: Array<{ id: string; name: string; properties: Record<string, string>; children: unknown[] }>;
  nodeTree: unknown;
}

/**
 * Recursively extracts visual properties from a Figma node into a
 * lightweight tree suitable for rendering to HTML/CSS.
 */
export function extractNodeTree(node: FigmaNode): unknown {
  if (node.visible === false) return null;

  const n: Record<string, unknown> = {
    type: node.type,
    name: node.name,
    bounds: node.absoluteBoundingBox || null,
  };

  if (node.fills)        n.fills = node.fills;
  if (node.strokes)      n.strokes = node.strokes;
  if (node.strokeWeight) n.strokeWeight = node.strokeWeight;
  if (node.cornerRadius != null) n.cornerRadius = node.cornerRadius;
  if (node.rectangleCornerRadii) n.rectangleCornerRadii = node.rectangleCornerRadii;
  if (node.opacity != null && node.opacity !== 1) n.opacity = node.opacity;
  if (node.clipsContent) n.clipsContent = node.clipsContent;
  if (node.effects && node.effects.length > 0) n.effects = node.effects;

  if (node.layoutMode && node.layoutMode !== 'NONE') {
    n.layoutMode = node.layoutMode;
    if (node.primaryAxisAlignItems) n.primaryAxisAlignItems = node.primaryAxisAlignItems;
    if (node.counterAxisAlignItems) n.counterAxisAlignItems = node.counterAxisAlignItems;
    if (node.paddingLeft != null)   n.paddingLeft = node.paddingLeft;
    if (node.paddingRight != null)  n.paddingRight = node.paddingRight;
    if (node.paddingTop != null)    n.paddingTop = node.paddingTop;
    if (node.paddingBottom != null) n.paddingBottom = node.paddingBottom;
    if (node.itemSpacing != null)   n.itemSpacing = node.itemSpacing;
  }

  if (node.type === 'TEXT') {
    n.characters = node.characters || '';
    const s = (node.style || {}) as Record<string, unknown>;
    const textStyle: Record<string, unknown> = {};
    if (s.fontFamily)         textStyle.fontFamily = s.fontFamily;
    if (s.fontSize)           textStyle.fontSize = s.fontSize;
    if (s.fontWeight)         textStyle.fontWeight = s.fontWeight;
    if (s.textAlignHorizontal) textStyle.textAlign = s.textAlignHorizontal;
    if (s.lineHeightPx)       textStyle.lineHeight = s.lineHeightPx;
    if (s.letterSpacing)      textStyle.letterSpacing = s.letterSpacing;
    if (s.textCase)           textStyle.textCase = s.textCase;
    if (s.textDecoration)     textStyle.textDecoration = s.textDecoration;
    n.textStyle = textStyle;
  }

  if (node.children && node.children.length > 0) {
    n.children = node.children.map(extractNodeTree).filter(Boolean);
  }

  return n;
}

/**
 * Recursively walks the Figma document tree and collects all COMPONENT
 * and COMPONENT_SET nodes.
 */
export function extractComponents(
  node: FigmaNode | FigmaDocument,
  pageName = '',
  components: ExtractedComponent[] = []
): ExtractedComponent[] {
  const nodeType = node.type;

  if (nodeType === 'CANVAS') {
    pageName = node.name;
  }

  if (nodeType === 'COMPONENT' || nodeType === 'COMPONENT_SET') {
    const figmaNode = node as FigmaNode;
    const props = figmaNode.componentPropertyDefinitions || {};

    const variants =
      nodeType === 'COMPONENT_SET'
        ? (figmaNode.children || []).map(c => ({
            id: c.id,
            name: c.name,
            properties: parseVariantProperties(c.name),
            children: [extractNodeTree(c)].filter(Boolean),
          }))
        : [];

    const entry: ExtractedComponent = {
      figmaNodeId: figmaNode.id,
      figmaNodeType: nodeType as 'COMPONENT' | 'COMPONENT_SET',
      figmaPageName: pageName,
      name: figmaNode.name,
      figmaDescription: figmaNode.description || '',
      figmaProps: props as Record<string, unknown>,
      variants,
      nodeTree:
        nodeType === 'COMPONENT'
          ? extractNodeTree(figmaNode)
          : (figmaNode.children?.[0] ? extractNodeTree(figmaNode.children[0]) : null),
    };

    components.push(entry);

    // Don't recurse into COMPONENT_SET children — variants are already captured above
    if (nodeType === 'COMPONENT_SET') return components;
  }

  const children = (node as FigmaNode).children || [];
  for (const child of children) {
    extractComponents(child, pageName, components);
  }

  return components;
}

/**
 * Parses Figma variant name like "Size=Large, State=Hover" into properties object.
 */
function parseVariantProperties(name: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const part of name.split(',')) {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value !== undefined) {
      props[key] = value;
    }
  }
  return props;
}

export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_/]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
