'use client';

import { useState } from 'react';
import { DocumentationTab } from './DocumentationTab';
import { ApiDataTab } from './ApiDataTab';
import { cn } from '@/lib/utils';

interface ComponentDetailClientProps {
  component: {
    id: string;
    slug: string;
    name: string;
    figmaNodeId: string;
    figmaNodeType: string;
    figmaPageName: string | null;
    figmaDescription: string | null;
    variants: unknown;
    figmaProps: unknown;
    nodeTree: unknown;
    thumbnailUrl: string | null;
    docDescription: unknown;
    docUsageNotes: unknown;
    dos: string[];
    donts: string[];
    customProps: unknown;
    categoryId: string | null;
    isHidden: boolean;
    sortOrder: number;
  };
  categories: Array<{ id: string; name: string }>;
  systemId: string;
}

const tabs = ['Documentation', 'API Data'] as const;

export function ComponentDetailClient({
  component,
  categories,
  systemId,
}: ComponentDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'Documentation' | 'API Data'>('Documentation');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Documentation' && (
        <DocumentationTab
          component={component}
          categories={categories}
          systemId={systemId}
        />
      )}
      {activeTab === 'API Data' && (
        <ApiDataTab component={component} />
      )}
    </div>
  );
}
