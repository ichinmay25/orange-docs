/**
 * Figma sync orchestrator.
 * Non-destructive: documentation fields (docDescription, docUsageNotes, dos, donts) are never overwritten.
 * figmaNodeId is the conflict key for upserts.
 */

import { db, Prisma } from '@designbase/db';
import { getFigmaClientForUser } from '@/lib/figma/client';
import { extractComponents, nameToSlug } from '@/lib/figma/extractor';
import {
  extractTokensFromVariables,
  extractTokensFromStyles,
  extractTokensInferred,
} from '@/lib/figma/tokens';
import { fetchAndUploadThumbnails } from '@/lib/figma/thumbnails';

export async function runFigmaSync(designSystemId: string): Promise<void> {
  const system = await db.designSystem.findUnique({
    where: { id: designSystemId },
    include: { user: true },
  });

  if (!system) throw new Error('Design system not found');

  const sync = await db.figmaSync.create({
    data: { designSystemId, status: 'SYNCING' },
  });

  await db.designSystem.update({
    where: { id: designSystemId },
    data: { syncStatus: 'SYNCING' },
  });

  try {
    const client = await getFigmaClientForUser(system.userId);

    // Phase 0: Validate file
    const fileInfo = await client.getFile(system.figmaFileKey, 1);
    await db.designSystem.update({
      where: { id: designSystemId },
      data: { figmaFileName: fileInfo.name },
    });

    // Phase 1: Tokens
    let tokens = await extractTokensFromVariables(client, system.figmaFileKey);
    if (tokens.length === 0) {
      tokens = await extractTokensFromStyles(client, system.figmaFileKey);
    }

    // Phase 2: Components
    const fullFile = await client.getFullFile(system.figmaFileKey);
    const components = extractComponents(fullFile.document);

    // Phase 1c: Inferred tokens if still empty
    if (tokens.length === 0) {
      tokens = extractTokensInferred(components);
    }

    // Upsert tokens
    for (const token of tokens) {
      const rawValue = token.rawValue !== undefined
        ? (token.rawValue as Prisma.InputJsonValue)
        : Prisma.JsonNull;
      await db.token.upsert({
        where: { designSystemId_slug: { designSystemId, slug: token.slug } },
        create: {
          designSystemId,
          type: token.type,
          source: token.source,
          name: token.name,
          slug: token.slug,
          value: token.value,
          rawValue,
          hexValue: token.hexValue,
          figmaId: token.figmaId,
          figmaVariableCollectionId: token.figmaVariableCollectionId,
          group: token.group,
          description: token.description,
        },
        update: {
          type: token.type,
          source: token.source,
          value: token.value,
          rawValue,
          hexValue: token.hexValue,
          figmaId: token.figmaId,
          figmaVariableCollectionId: token.figmaVariableCollectionId,
          group: token.group,
          description: token.description,
        },
      });
    }

    // Upsert components (non-destructive)
    const upsertedComponents: Array<{ id: string; figmaNodeId: string }> = [];

    for (const comp of components) {
      const slug = nameToSlug(comp.name);
      const upserted = await db.component.upsert({
        where: {
          designSystemId_figmaNodeId: {
            designSystemId,
            figmaNodeId: comp.figmaNodeId,
          },
        },
        create: {
          designSystemId,
          figmaNodeId: comp.figmaNodeId,
          figmaNodeType: comp.figmaNodeType,
          figmaPageName: comp.figmaPageName,
          name: comp.name,
          slug,
          figmaDescription: comp.figmaDescription,
          variants: comp.variants as Prisma.InputJsonValue ?? Prisma.JsonNull,
          figmaProps: comp.figmaProps as Prisma.InputJsonValue ?? Prisma.JsonNull,
          nodeTree: comp.nodeTree as Prisma.InputJsonValue ?? Prisma.JsonNull,
        },
        update: {
          // Only update Figma-sourced fields, never touch doc fields
          figmaNodeType: comp.figmaNodeType,
          figmaPageName: comp.figmaPageName,
          name: comp.name,
          figmaDescription: comp.figmaDescription,
          variants: comp.variants as Prisma.InputJsonValue ?? Prisma.JsonNull,
          figmaProps: comp.figmaProps as Prisma.InputJsonValue ?? Prisma.JsonNull,
          nodeTree: comp.nodeTree as Prisma.InputJsonValue ?? Prisma.JsonNull,
        },
        select: { id: true, figmaNodeId: true },
      });

      upsertedComponents.push(upserted);
    }

    // Delete components no longer present in Figma (e.g. stale variants)
    const syncedNodeIds = upsertedComponents.map(c => c.figmaNodeId);
    await db.component.deleteMany({
      where: {
        designSystemId,
        figmaNodeId: { notIn: syncedNodeIds },
      },
    });

    // Phase 3: Thumbnails
    let thumbnailsUploaded = 0;
    try {
      const thumbnailResults = await fetchAndUploadThumbnails(
        client,
        system.figmaFileKey,
        designSystemId,
        upsertedComponents
      );

      for (const result of thumbnailResults) {
        await db.component.updateMany({
          where: { designSystemId, figmaNodeId: result.figmaNodeId },
          data: {
            thumbnailUrl: result.thumbnailUrl,
            thumbnailStoragePath: result.storagePath,
          },
        });
        thumbnailsUploaded++;
      }
    } catch (err) {
      console.warn('Thumbnail upload phase failed (non-fatal):', err);
    }

    // Mark sync done
    await db.figmaSync.update({
      where: { id: sync.id },
      data: {
        status: 'DONE',
        finishedAt: new Date(),
        componentsFound: components.length,
        tokensFound: tokens.length,
        thumbnailsUploaded,
        figmaLastModified: fullFile.lastModified,
      },
    });

    await db.designSystem.update({
      where: { id: designSystemId },
      data: { syncStatus: 'DONE', lastSyncAt: new Date() },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await db.figmaSync.update({
      where: { id: sync.id },
      data: { status: 'ERROR', finishedAt: new Date(), errorMessage },
    });
    await db.designSystem.update({
      where: { id: designSystemId },
      data: { syncStatus: 'ERROR' },
    });
    throw err;
  }
}
