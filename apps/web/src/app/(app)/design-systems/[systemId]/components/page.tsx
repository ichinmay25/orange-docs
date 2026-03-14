import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import { ComponentSearch } from '@/components/component-list/ComponentSearch';
import { Layers } from 'lucide-react';

export default async function ComponentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ systemId: string }>;
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { systemId } = await params;
  const { search, category } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const system = await db.designSystem.findFirst({
    where: { id: systemId, userId: user!.id },
    select: { id: true, name: true },
  });
  if (!system) notFound();

  const components = await db.component.findMany({
    where: {
      designSystemId: systemId,
      ...(category && {
        category: { name: { equals: category, mode: 'insensitive' } },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { figmaDescription: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  const categories = await db.category.findMany({
    where: { designSystemId: systemId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Components <span className="text-gray-400 font-normal text-base ml-1">({components.length})</span>
        </h2>
        <ComponentSearch />
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <Link
            href={`/design-systems/${systemId}/components`}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !category ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/design-systems/${systemId}/components?category=${encodeURIComponent(cat.name)}`}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                category === cat.name ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {components.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">
            {search || category ? 'No components match your filters' : 'No components yet'}
          </h3>
          <p className="text-sm text-gray-500">
            {!search && !category && 'Trigger a sync to import components from Figma'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {components.map(component => (
            <Link
              key={component.id}
              href={`/design-systems/${systemId}/components/${component.slug}`}
              className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="aspect-video bg-gray-50 relative">
                {component.thumbnailUrl ? (
                  <Image
                    src={component.thumbnailUrl}
                    alt={component.name}
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Layers className="w-8 h-8 text-gray-200" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-700">
                  {component.name}
                </p>
                {component.category && (
                  <p className="text-xs text-gray-400 mt-0.5">{component.category.name}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
