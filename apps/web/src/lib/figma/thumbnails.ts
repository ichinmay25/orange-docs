/**
 * Thumbnail fetching and Supabase Storage upload.
 * Batches of 50, 1500ms delay between batches, exponential backoff on 429.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import type { FigmaClient } from './client';

const BATCH_SIZE = 50;
const BATCH_DELAY = 1500;
const MAX_RETRIES = 4;

export interface ThumbnailResult {
  figmaNodeId: string;
  thumbnailUrl: string;
  storagePath: string;
}

export async function fetchAndUploadThumbnails(
  client: FigmaClient,
  fileKey: string,
  designSystemId: string,
  components: Array<{ figmaNodeId: string; id: string }>
): Promise<ThumbnailResult[]> {
  const results: ThumbnailResult[] = [];
  const nodeIds = components.map(c => c.figmaNodeId);
  const idToDbId = new Map(components.map(c => [c.figmaNodeId, c.id]));

  for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
    const batch = nodeIds.slice(i, i + BATCH_SIZE);
    const imageMap = await fetchImageUrlsWithRetry(client, fileKey, batch);

    // Download and upload each image
    await Promise.allSettled(
      batch.map(async nodeId => {
        const imageUrl = imageMap[nodeId];
        if (!imageUrl) return;

        const dbId = idToDbId.get(nodeId);
        if (!dbId) return;

        try {
          const res = await fetch(imageUrl);
          if (!res.ok) return;
          const buffer = await res.arrayBuffer();

          const storagePath = `thumbnails/${designSystemId}/${dbId}.png`;
          const { error } = await supabaseAdmin.storage
            .from('thumbnails')
            .upload(storagePath, buffer, {
              contentType: 'image/png',
              upsert: true,
            });

          if (error) {
            console.error(`Storage upload failed for ${nodeId}:`, error.message);
            return;
          }

          const { data: urlData } = supabaseAdmin.storage
            .from('thumbnails')
            .getPublicUrl(storagePath);

          results.push({
            figmaNodeId: nodeId,
            thumbnailUrl: urlData.publicUrl,
            storagePath,
          });
        } catch (err) {
          console.error(`Thumbnail failed for ${nodeId}:`, err);
        }
      })
    );

    if (i + BATCH_SIZE < nodeIds.length) {
      await sleep(BATCH_DELAY);
    }
  }

  return results;
}

async function fetchImageUrlsWithRetry(
  client: FigmaClient,
  fileKey: string,
  nodeIds: string[]
): Promise<Record<string, string | null>> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await client.getImageUrls(fileKey, nodeIds, 'png', 2);
      return res.images;
    } catch (err) {
      const isRateLimit = err instanceof Error && err.message.includes('429');
      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        await sleep(delay);
      } else {
        console.warn('Image URL fetch failed:', err instanceof Error ? err.message : err);
        return {};
      }
    }
  }
  return {};
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
