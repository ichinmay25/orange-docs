import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@designbase/db';
import { Layers } from 'lucide-react';

export default async function PublicHomePage({
  params,
}: {
  params: Promise<{ publishSlug: string }>;
}) {
  const { publishSlug } = await params;

  const system = await db.designSystem.findFirst({
    where: { publishSlug, isPublished: true },
    include: {
      components: {
        where: { isHidden: false },
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
      tokens: {
        where: { type: 'COLOR' },
        orderBy: [{ group: 'asc' }, { name: 'asc' }],
      },
      categories: {
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
    },
  });
  if (!system) notFound();

  const colorsByGroup = system.tokens.reduce<Record<string, typeof system.tokens>>((acc, t) => {
    const g = t.group ?? 'Colors';
    if (!acc[g]) acc[g] = [];
    acc[g].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-12">
      {/* Color tokens */}
      {system.tokens.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Colors</h2>
          {Object.entries(colorsByGroup).map(([group, colors]) => (
            <div key={group} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{group}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {colors.map(token => (
                  <div key={token.id} className="text-center">
                    <div
                      className="w-full aspect-square rounded-xl border border-gray-200 mb-1.5"
                      style={{ backgroundColor: token.hexValue ?? token.value }}
                    />
                    <p className="text-xs text-gray-700 font-medium truncate">{token.name.split('/').pop()}</p>
                    <p className="text-xs text-gray-400 font-mono">{token.hexValue ?? token.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Components */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Components <span className="text-gray-400 font-normal">({system.components.length})</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {system.components.map(component => (
            <Link
              key={component.id}
              href={`/ds/${publishSlug}/components/${component.slug}`}
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
                <p className="text-sm font-medium text-gray-900 truncate">{component.name}</p>
                {component.category && (
                  <p className="text-xs text-gray-400 mt-0.5">{component.category.name}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
