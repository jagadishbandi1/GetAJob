"use client";

import { useRef, type ReactNode } from "react";

/**
 * Card wrapper with a radial sage glow that follows the cursor, plus a border
 * that brightens to --border-hover. Replaces the old `.glass::after` glow.
 * Renders a bordered surface; pass `className` for sizing/padding.
 */
export default function HoverGlow({
  children,
  className = "",
  radius = 16,
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group relative overflow-hidden ${className}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: radius,
        transition: "border-color 0.25s ease",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), var(--accent-glow) 0%, transparent 60%)",
          borderRadius: radius,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
