import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@designbase/db';
import type { TokenType } from '@designbase/types';

const TOKEN_TYPES: TokenType[] = ['COLOR', 'TYPOGRAPHY', 'SPACING', 'RADIUS', 'SHADOW', 'OPACITY', 'OTHER'];

export default async function TokensPage({
  params,
  searchParams,
}: {
  params: Promise<{ systemId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { systemId } = await params;
  const { type } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const system = await db.designSystem.findFirst({
    where: { id: systemId, userId: user!.id },
    select: { id: true },
  });
  if (!system) notFound();

  const activeType = (type ?? 'ALL') as TokenType | 'ALL';

  const tokens = await db.token.findMany({
    where: {
      designSystemId: systemId,
      ...(activeType !== 'ALL' && { type: activeType }),
    },
    orderBy: [{ type: 'asc' }, { group: 'asc' }, { name: 'asc' }],
  });

  const grouped = tokens.reduce<Record<string, typeof tokens>>((acc, token) => {
    const group = token.group ?? 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(token);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Tokens <span className="text-gray-400 font-normal text-base ml-1">({tokens.length})</span>
        </h2>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['ALL', ...TOKEN_TYPES] as const).map(t => (
          <a
            key={t}
            href={t === 'ALL' ? '?' : `?type=${t}`}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeType === t
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t}
          </a>
        ))}
      </div>

      {tokens.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No tokens found. Sync your Figma file to import tokens.
        </p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([group, groupTokens]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{group}</h3>
              {activeType === 'COLOR' || (activeType === 'ALL' && groupTokens.every(t => t.type === 'COLOR')) ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {groupTokens.map(token => (
                    <div key={token.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div
                        className="h-20 w-full"
                        style={{ backgroundColor: token.hexValue ?? token.value }}
                      />
                      <div className="p-3">
                        <p className="text-xs font-medium text-gray-900 truncate">{token.name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{token.hexValue ?? token.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {groupTokens.map(token => (
                    <div key={token.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        {token.hexValue && (
                          <div
                            className="w-5 h-5 rounded border border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: token.hexValue }}
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{token.name}</p>
                          {token.description && (
                            <p className="text-xs text-gray-400">{token.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-gray-600">{token.value}</p>
                        <span className="text-xs text-gray-400">{token.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
