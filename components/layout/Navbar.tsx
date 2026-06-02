"use client";

import MagneticWrapper from "@/components/effects/MagneticWrapper";
import type { Section } from "@/hooks/types";

const navItems: { key: Section; label: string }[] = [
  { key: "home", label: "home" },
  { key: "knowledge", label: "knowledge" },
  { key: "tracker", label: "tracker" },
  { key: "training", label: "training" },
];

export default function Navbar({
  section,
  onSectionChange,
}: {
  section: Section;
  onSectionChange: (section: Section) => void;
}) {
  return (
    <header className="fixed left-0 right-0 top-5 z-50 flex justify-center px-4">
      <nav className="flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border border-border-base bg-bg-surface/90 px-2 py-1.5 shadow-2xl backdrop-blur">
        <MagneticWrapper>
          <button
            type="button"
            onClick={() => onSectionChange("home")}
            className="flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent"
          >
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
            getajobfaster
          </button>
        </MagneticWrapper>

        <div className="hidden h-5 w-px bg-border-base sm:block" />

        <div className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const active = section === item.key;
            return (
              <MagneticWrapper key={item.key}>
                <button
                  type="button"
                  onClick={() => onSectionChange(item.key)}
                  className={`relative h-9 rounded-full px-3 text-xs transition ${
                    active ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                </button>
              </MagneticWrapper>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

