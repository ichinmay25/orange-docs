import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import Fuse from 'fuse.js';
import {
  getSystemInfo,
  listComponents,
  getComponent,
  searchComponents,
  getTokens,
} from '../client/api.js';

export function registerTools(server: McpServer) {
  // list_components
  server.tool(
    'list_components',
    'List all components in the design system. Returns name, slug, category, and description.',
    { category: z.string().optional().describe('Filter by category name') },
    async ({ category }) => {
      try {
        const components = await listComponents(category);
        const items = components.map(c => ({
          slug: c.slug,
          name: c.name,
          category: c.category?.name ?? null,
          description: c.figmaDescription,
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    }
  );

  // get_component
  server.tool(
    'get_component',
    'Get full details for a component by slug: description, usage notes, dos/donts, variants, figmaProps.',
    { slug: z.string().describe('Component slug (kebab-case, e.g. "primary-button")') },
    async ({ slug }) => {
      try {
        const component = await getComponent(slug);
        return {
          content: [{ type: 'text', text: JSON.stringify(component, null, 2) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('404')) {
          return {
            content: [{ type: 'text', text: `Component "${slug}" not found.` }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: `Error: ${msg}` }],
          isError: true,
        };
      }
    }
  );

  // search_components
  server.tool(
    'search_components',
    'Fuzzy search components by name or description. Returns top 10 results.',
    { query: z.string().describe('Search query') },
    async ({ query }) => {
      try {
        const components = await listComponents();
        const fuse = new Fuse(components, {
          keys: ['name', 'figmaDescription'],
          threshold: 0.4,
          includeScore: true,
        });
        const results = fuse.search(query).slice(0, 10);
        if (results.length === 0) {
          return {
            content: [{ type: 'text', text: `No results for "${query}".` }],
          };
        }
        const items = results.map(r => ({
          slug: r.item.slug,
          name: r.item.name,
          category: r.item.category?.name ?? null,
          description: r.item.figmaDescription,
          score: Math.round((1 - (r.score ?? 0)) * 100) + '%',
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    }
  );

  // get_component_image
  server.tool(
    'get_component_image',
    'Get the thumbnail PNG URL for a component by slug.',
    { slug: z.string().describe('Component slug') },
    async ({ slug }) => {
      try {
        const component = await getComponent(slug);
        if (!component.thumbnailUrl) {
          return {
            content: [{ type: 'text', text: 'No thumbnail available for this component.' }],
          };
        }
        return {
          content: [{ type: 'text', text: component.thumbnailUrl }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    }
  );

  // get_tokens
  server.tool(
    'get_tokens',
    'Get design tokens filtered by type. Type can be: COLOR, TYPOGRAPHY, SPACING, RADIUS, SHADOW, OPACITY, OTHER, or ALL.',
    {
      type: z.enum(['COLOR', 'TYPOGRAPHY', 'SPACING', 'RADIUS', 'SHADOW', 'OPACITY', 'OTHER', 'ALL'])
        .default('ALL')
        .describe('Token type to filter by'),
    },
    async ({ type }) => {
      try {
        const tokens = await getTokens(type);
        return {
          content: [{ type: 'text', text: JSON.stringify(tokens, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    }
  );

  // get_library_info
  server.tool(
    'get_library_info',
    'Get metadata about this design system: name, last sync time, component count, token count.',
    {},
    async () => {
      try {
        const info = await getSystemInfo();
        return {
          content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    }
  );
}
