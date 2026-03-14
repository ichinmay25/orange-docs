import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { ComponentDetailClient } from '@/components/component-detail/ComponentDetailClient';
import Image from 'next/image';
import { Layers } from 'lucide-react';

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ systemId: string; componentSlug: string }>;
}) {
  const { systemId, componentSlug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const system = await db.designSystem.findFirst({
    where: { id: systemId, userId: user!.id },
    select: { id: true },
  });
  if (!system) notFound();

  const component = await db.component.findFirst({
    where: { designSystemId: systemId, slug: componentSlug },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!component) notFound();

  const categories = await db.category.findMany({
    where: { designSystemId: systemId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start gap-6 mb-8">
        {/* Thumbnail */}
        <div className="w-40 h-28 bg-gray-50 rounded-xl border border-gray-200 flex-shrink-0 relative overflow-hidden">
          {component.thumbnailUrl ? (
            <Image
              src={component.thumbnailUrl}
              alt={component.name}
              fill
              className="object-contain p-3"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Layers className="w-8 h-8 text-gray-200" />
            </div>
          )}
        </div>

        {/* Header info */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{component.name}</h1>
          {component.figmaDescription && (
            <p className="mt-1 text-sm text-gray-500">{component.figmaDescription}</p>
          )}
          <div className="mt-2 flex gap-3 text-xs text-gray-400">
            <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">{component.figmaNodeType}</span>
            {component.figmaPageName && <span>{component.figmaPageName}</span>}
          </div>
        </div>
      </div>

      <ComponentDetailClient
        component={JSON.parse(JSON.stringify(component))}
        categories={categories}
        systemId={systemId}
      />
    </div>
  );
}
