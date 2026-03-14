'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { Check, Plus, X } from 'lucide-react';

interface DocumentationTabProps {
  component: {
    id: string;
    slug: string;
    docDescription: unknown;
    docUsageNotes: unknown;
    dos: string[];
    donts: string[];
    categoryId: string | null;
    isHidden: boolean;
  };
  categories: Array<{ id: string; name: string }>;
  systemId: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function DocumentationTab({ component, categories, systemId }: DocumentationTabProps) {
  const [docDescription, setDocDescription] = useState<unknown>(component.docDescription);
  const [docUsageNotes, setDocUsageNotes] = useState<unknown>(component.docUsageNotes);
  const [dos, setDos] = useState<string[]>(component.dos);
  const [donts, setDonts] = useState<string[]>(component.donts);
  const [categoryId, setCategoryId] = useState<string | null>(component.categoryId);
  const [isHidden, setIsHidden] = useState(component.isHidden);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (overrides?: Partial<{
      docDescription: unknown;
      docUsageNotes: unknown;
      dos: string[];
      donts: string[];
      categoryId: string | null;
      isHidden: boolean;
    }>) => {
      setSaveState('saving');
      try {
        const res = await fetch(
          `/api/design-systems/${systemId}/components/${component.slug}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              docDescription: overrides?.docDescription ?? docDescription,
              docUsageNotes: overrides?.docUsageNotes ?? docUsageNotes,
              dos: overrides?.dos ?? dos,
              donts: overrides?.donts ?? donts,
              categoryId: overrides?.categoryId !== undefined ? overrides.categoryId : categoryId,
              isHidden: overrides?.isHidden ?? isHidden,
            }),
          }
        );
        setSaveState(res.ok ? 'saved' : 'error');
      } catch {
        setSaveState('error');
      }
      setTimeout(() => setSaveState('idle'), 2500);
    },
    [systemId, component.slug, docDescription, docUsageNotes, dos, donts, categoryId, isHidden]
  );

  function debouncedSave(overrides?: Parameters<typeof save>[0]) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(overrides), 800);
  }

  function handleDescriptionChange(json: unknown) {
    setDocDescription(json);
    debouncedSave({ docDescription: json });
  }

  function handleUsageChange(json: unknown) {
    setDocUsageNotes(json);
    debouncedSave({ docUsageNotes: json });
  }

  function addDo() {
    if (!newDo.trim()) return;
    const updated = [...dos, newDo.trim()];
    setDos(updated);
    setNewDo('');
    save({ dos: updated });
  }

  function removeDo(i: number) {
    const updated = dos.filter((_, idx) => idx !== i);
    setDos(updated);
    save({ dos: updated });
  }

  function addDont() {
    if (!newDont.trim()) return;
    const updated = [...donts, newDont.trim()];
    setDonts(updated);
    setNewDont('');
    save({ donts: updated });
  }

  function removeDont(i: number) {
    const updated = donts.filter((_, idx) => idx !== i);
    setDonts(updated);
    save({ donts: updated });
  }

  return (
    <div className="space-y-8">
      {/* Save indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Changes save automatically</span>
        {saveState === 'saving' && <span className="text-xs text-gray-400">Saving...</span>}
        {saveState === 'saved' && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
        {saveState === 'error' && <span className="text-xs text-red-500">Save failed</span>}
      </div>

      {/* Category + Visibility */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            value={categoryId ?? ''}
            onChange={e => {
              const val = e.target.value || null;
              setCategoryId(val);
              save({ categoryId: val });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Uncategorized</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-300 rounded-lg">
            <input
              type="checkbox"
              checked={isHidden}
              onChange={e => {
                setIsHidden(e.target.checked);
                save({ isHidden: e.target.checked });
              }}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Hidden</span>
          </label>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <RichTextEditor
            content={docDescription}
            onChange={handleDescriptionChange}
            placeholder="Describe this component..."
          />
        </div>
      </div>

      {/* Usage notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Usage notes</label>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <RichTextEditor
            content={docUsageNotes}
            onChange={handleUsageChange}
            placeholder="When and how to use this component..."
          />
        </div>
      </div>

      {/* Dos and Don'ts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Dos */}
        <div>
          <label className="block text-sm font-medium text-green-700 mb-2">Do</label>
          <ul className="space-y-2 mb-3">
            {dos.map((item, i) => (
              <li key={i} className="flex items-start gap-2 bg-green-50 rounded-lg px-3 py-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="flex-1 text-sm text-green-800">{item}</span>
                <button onClick={() => removeDo(i)} className="text-green-400 hover:text-green-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDo}
              onChange={e => setNewDo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDo()}
              placeholder="Add a do..."
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={addDo}
              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Don'ts */}
        <div>
          <label className="block text-sm font-medium text-red-700 mb-2">Don&apos;t</label>
          <ul className="space-y-2 mb-3">
            {donts.map((item, i) => (
              <li key={i} className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span className="flex-1 text-sm text-red-800">{item}</span>
                <button onClick={() => removeDont(i)} className="text-red-400 hover:text-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDont}
              onChange={e => setNewDont(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDont()}
              placeholder="Add a don't..."
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              onClick={addDont}
              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
