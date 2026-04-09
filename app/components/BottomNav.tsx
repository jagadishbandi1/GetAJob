'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ACCENT = '#60935D';
const MUTED = '#4a4a4a';

const tabs = [
  {
    href: '/',
    label: 'Feed',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="5" rx="1.5" stroke={active ? ACCENT : MUTED} strokeWidth="1.5" />
        <rect x="13" y="3" width="8" height="5" rx="1.5" stroke={active ? ACCENT : MUTED} strokeWidth="1.5" />
        <rect x="3" y="11" width="8" height="10" rx="1.5" stroke={active ? ACCENT : MUTED} strokeWidth="1.5" />
        <rect x="13" y="11" width="8" height="10" rx="1.5" stroke={active ? ACCENT : MUTED} strokeWidth="1.5" />
        {active && <rect x="3" y="3" width="8" height="5" rx="1.5" fill={ACCENT} opacity="0.2" />}
        {active && <rect x="3" y="11" width="8" height="10" rx="1.5" fill={ACCENT} opacity="0.2" />}
      </svg>
    ),
  },
  {
    href: '/goals',
    label: 'Goals',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={active ? ACCENT : MUTED} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="5" stroke={active ? ACCENT : MUTED} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2" fill={active ? ACCENT : MUTED} />
      </svg>
    ),
  },
  {
    href: '/saved',
    label: 'Saved',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 4a2 2 0 012-2h10a2 2 0 012 2v17l-7-3.5L5 21V4z"
          fill={active ? ACCENT : 'none'}
          fillOpacity={active ? 0.2 : 0}
          stroke={active ? ACCENT : MUTED}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/stats',
    label: 'Stats',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="13" width="4" height="8" rx="1" fill={active ? ACCENT : MUTED} fillOpacity={active ? 1 : 0.5} />
        <rect x="10" y="8" width="4" height="13" rx="1" fill={active ? ACCENT : MUTED} fillOpacity={active ? 1 : 0.5} />
        <rect x="17" y="3" width="4" height="18" rx="1" fill={active ? ACCENT : MUTED} fillOpacity={active ? 1 : 0.5} />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10,10,10,0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        height: '60px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '8px 0',
              color: active ? ACCENT : MUTED,
              textDecoration: 'none',
              fontSize: '11px',
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.03em',
              transition: 'color 0.15s',
            }}
          >
            {tab.icon(active)}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
