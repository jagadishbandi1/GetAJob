"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MagneticWrapper from "@/components/effects/MagneticWrapper";

const navItems: { href: string; label: string }[] = [
  { href: "/", label: "home" },
  { href: "/knowledge", label: "knowledge" },
  { href: "/tracker", label: "tracker" },
  { href: "/training", label: "training" },
  { href: "/about", label: "about" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed left-0 right-0 top-5 z-50 flex justify-center px-4">
      <nav className="flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border border-border-base bg-bg-surface/90 px-2 py-1.5 shadow-2xl backdrop-blur">
        <MagneticWrapper>
          <Link
            href="/"
            className="flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent"
          >
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
            getajobfaster
          </Link>
        </MagneticWrapper>

        <div className="hidden h-5 w-px bg-border-base sm:block" />

        <div className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <MagneticWrapper key={item.href}>
                <Link
                  href={item.href}
                  className={`relative h-9 rounded-full px-3 text-xs transition flex items-center ${
                    active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                </Link>
              </MagneticWrapper>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
