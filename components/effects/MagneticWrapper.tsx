"use client";

import { useRef, type ReactNode } from "react";

/**
 * Wraps an element with a magnetic pull: when the cursor is within `radius`px,
 * the child translates toward it (capped at `strength`px). Resets on leave.
 */
export default function MagneticWrapper({
  children,
  radius = 70,
  strength = 8,
  className,
}: {
  children: ReactNode;
  radius?: number;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      el.style.transform = "translate(0, 0)";
      return;
    }
    const pull = (1 - dist / radius) * strength;
    const angle = Math.atan2(dy, dx);
    el.style.transform = `translate(${Math.cos(angle) * pull}px, ${Math.sin(angle) * pull}px)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)";
  };

  return (
    <div
      ref={ref}
      data-magnetic
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={className}
      style={{ transition: "transform 0.2s cubic-bezier(0.33, 1, 0.68, 1)", display: "inline-block" }}
    >
      {children}
    </div>
  );
}
