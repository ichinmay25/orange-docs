import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@designbase/db';
import { RichTextDisplay } from '@/components/editor/RichTextDisplay';
import { Layers, ArrowLeft, Check, X } from 'lucide-react';

export default async function PublicComponentPage({
  params,
}: {
  params: Promise<{ publishSlug: string; componentSlug: string }>;
}) {
  const { publishSlug, componentSlug } = await params;

  const system = await db.designSystem.findFirst({
    where: { publishSlug, isPublished: true },
    select: { id: true, name: true },
  });
  if (!system) notFound();

  const component = await db.component.findFirst({
    where: { designSystemId: system.id, slug: componentSlug, isHidden: false },
    include: { category: { select: { name: true } } },
  });
  if (!component) notFound();

  const variants = component.variants as Array<{ id: string; name: string; properties: Record<string, string> }> | null;

  return (
    <div className="max-w-3xl">
      <Link
        href={`/ds/${publishSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {system.name}
      </Link>

      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{component.name}</h1>
          {component.category && (
            <span className="mt-1 inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {component.category.name}
            </span>
          )}
          {component.figmaDescription && (
            <p className="mt-2 text-sm text-gray-600">{component.figmaDescription}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {component.docDescription && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Description</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <RichTextDisplay content={component.docDescription} />
          </div>
        </section>
      )}

      {/* Usage notes */}
      {component.docUsageNotes && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Usage notes</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <RichTextDisplay content={component.docUsageNotes} />
          </div>
        </section>
      )}

      {/* Dos and Don'ts */}
      {(component.dos.length > 0 || component.donts.length > 0) && (
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            {component.dos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-700 mb-3">Do</h3>
                <ul className="space-y-2">
                  {component.dos.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 bg-green-50 rounded-lg px-3 py-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {component.donts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-3">Don&apos;t</h3>
                <ul className="space-y-2">
                  {component.donts.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2">
                      <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Variants */}
      {variants && variants.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Variants ({variants.length})</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {variants.map(v => (
              <div key={v.id} className="px-4 py-3">
                <p className="text-sm font-mono text-gray-700 mb-1">{v.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(v.properties).map(([k, val]) => (
                    <span key={k} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                      <span className="text-gray-400">{k}=</span>{val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
