'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Overview', path: '' },
  { label: 'Components', path: '/components' },
  { label: 'Tokens', path: '/tokens' },
  { label: 'Sync', path: '/sync' },
  { label: 'Settings', path: '/settings' },
];

export function SystemNavTabs({ systemId }: { systemId: string }) {
  const pathname = usePathname();
  const base = `/design-systems/${systemId}`;

  return (
    <nav className="flex gap-1">
      {tabs.map(tab => {
        const href = `${base}${tab.path}`;
        const isActive =
          tab.path === ''
            ? pathname === base
            : pathname.startsWith(href);

        return (
          <Link
            key={tab.path}
            href={href}
            className={cn(
              'px-3 py-2.5 text-sm font-medium border-b-2 transition-colors',
              isActive
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
