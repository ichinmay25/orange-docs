import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@designbase/db';
import { Layers } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publishSlug: string }>;
}): Promise<Metadata> {
  const { publishSlug } = await params;
  const system = await db.designSystem.findFirst({
    where: { publishSlug, isPublished: true },
    select: { name: true, description: true },
  });
  if (!system) return { title: 'Not found' };
  return {
    title: `${system.name} — Design System`,
    description: system.description ?? undefined,
  };
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ publishSlug: string }>;
}) {
  const { publishSlug } = await params;
  const system = await db.designSystem.findFirst({
    where: { publishSlug, isPublished: true },
    select: { id: true, name: true, description: true },
  });
  if (!system) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">{system.name}</h1>
            {system.description && (
              <p className="text-xs text-gray-500">{system.description}</p>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-8 py-8">{children}</main>
    </div>
  );
}
