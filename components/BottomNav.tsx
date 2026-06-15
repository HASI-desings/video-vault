'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Download, Library } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Downloader', icon: Download },
  { href: '/library', label: 'Library', icon: Library },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-charcoal-900/90 backdrop-blur-lg border-t border-charcoal-700 pb-safe">
      <div className="flex items-stretch max-w-md mx-auto">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            >
              <Icon
                size={22}
                strokeWidth={1.75}
                className={active ? 'text-accent' : 'text-charcoal-600'}
              />
              <span
                className={`text-[11px] tracking-wide ${
                  active ? 'text-accent' : 'text-charcoal-600'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
