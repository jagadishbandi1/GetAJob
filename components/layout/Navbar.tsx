"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MagneticWrapper from "@/components/effects/MagneticWrapper";

const navItems: { href: string; label: string }[] = [
  { href: "/", label: "home" },
  { href: "/knowledge", label: "knowledge" },
  { href: "/about", label: "about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMenuOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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

        <div className="hidden h-5 w-px bg-border-base sm:block md:block" />

        {/* desktop pill nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <MagneticWrapper key={item.href}>
                <Link
                  href={item.href}
                  className={`relative flex h-9 items-center rounded-full px-3 text-xs transition ${
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

        {/* mobile hamburger */}
        <button
          type="button"
          aria-label="open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full md:hidden"
        >
          <span className="relative flex h-3 w-4 flex-col justify-between">
            <span className="block h-0.5 w-full rounded-full bg-accent" />
            <span className="block h-0.5 w-full rounded-full bg-accent" />
            <span className="block h-0.5 w-full rounded-full bg-accent" />
          </span>
        </button>
      </nav>

      {/* mobile full-screen overlay */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col bg-bg transition-opacity duration-300 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex justify-end px-6 pt-6">
          <button
            type="button"
            aria-label="close menu"
            onClick={() => setMenuOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-base text-accent"
          >
            <span className="relative block h-4 w-4">
              <span className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-accent" />
              <span className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-accent" />
            </span>
          </button>
        </div>
        <nav className="flex flex-1 flex-col items-center justify-center gap-8">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <MagneticWrapper key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ transitionDelay: menuOpen ? `${index * 60 + 80}ms` : "0ms" }}
                  className={`block text-3xl font-serif transition-all duration-300 ${
                    menuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  } ${active ? "text-accent" : "text-text-secondary hover:text-text-primary"}`}
                >
                  {item.label}
                </Link>
              </MagneticWrapper>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
