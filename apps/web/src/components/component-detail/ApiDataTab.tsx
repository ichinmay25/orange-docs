'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

interface ApiDataTabProps {
  component: {
    figmaNodeId: string;
    figmaNodeType: string;
    figmaPageName: string | null;
    figmaDescription: string | null;
    variants: unknown;
    figmaProps: unknown;
    nodeTree: unknown;
  };
}

export function ApiDataTab({ component }: ApiDataTabProps) {
  const variants = component.variants as Array<{ id: string; name: string; properties: Record<string, string> }> | null;
  const figmaProps = component.figmaProps as Record<string, { type: string; defaultValue: unknown; variantOptions?: string[] }> | null;

  return (
    <div className="space-y-4">
      {/* Basic info */}
      <CollapsibleSection title="Figma metadata">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-400 text-xs mb-0.5">Node ID</dt>
            <dd className="font-mono text-gray-700 text-xs">{component.figmaNodeId}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs mb-0.5">Type</dt>
            <dd className="font-mono text-gray-700 text-xs">{component.figmaNodeType}</dd>
          </div>
          {component.figmaPageName && (
            <div>
              <dt className="text-gray-400 text-xs mb-0.5">Page</dt>
              <dd className="text-gray-700 text-xs">{component.figmaPageName}</dd>
            </div>
          )}
        </dl>
      </CollapsibleSection>

      {/* Props */}
      {figmaProps !== null && Object.keys(figmaProps).length > 0 ? (
        <CollapsibleSection title={`Props (${Object.keys(figmaProps).length})`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100 pb-2">
                <th className="pb-2 font-medium">Property</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Default</th>
                <th className="pb-2 font-medium">Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(figmaProps).map(([key, prop]) => (
                <tr key={key} className="py-2">
                  <td className="py-2 font-mono text-xs text-gray-700">{key}</td>
                  <td className="py-2">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{prop.type}</span>
                  </td>
                  <td className="py-2 text-xs text-gray-500">{String(prop.defaultValue ?? '')}</td>
                  <td className="py-2 text-xs text-gray-500">
                    {prop.variantOptions?.join(', ') ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>
      ) : null}

      {/* Variants */}
      {variants && variants.length > 0 && (
        <CollapsibleSection title={`Variants (${variants.length})`}>
          <div className="space-y-2">
            {variants.map(v => (
              <div key={v.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-xs font-mono text-gray-700">{v.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {Object.entries(v.properties).map(([k, val]) => (
                      <span key={k} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5">
                        <span className="text-gray-400">{k}=</span>{val}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Raw node tree */}
      {component.nodeTree != null ? (
        <CollapsibleSection title="Node tree (raw)">
          <pre className="text-xs text-gray-600 overflow-auto max-h-96 bg-gray-50 rounded p-3">
            {JSON.stringify(component.nodeTree, null, 2)}
          </pre>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
