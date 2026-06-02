"use client";

import { useEffect, useRef } from "react";

/**
 * Subtle architectural wireframe behind the hero — circles, triangles, grid
 * lines in --border. Parallaxes ±10px with the cursor. Absolutely positioned;
 * place inside a `relative` container.
 */
export default function GeometricBg() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      if (ref.current) ref.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <svg
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      style={{ transition: "transform 0.3s ease-out", opacity: 0.6 }}
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1200 800"
    >
      <g stroke="var(--border)" strokeWidth="1" fill="none">
        <circle cx="950" cy="180" r="140" />
        <circle cx="950" cy="180" r="90" />
        <polygon points="180,620 360,620 270,460" />
        <line x1="0" y1="300" x2="1200" y2="300" />
        <line x1="0" y1="500" x2="1200" y2="500" />
        <line x1="300" y1="0" x2="300" y2="800" />
        <line x1="800" y1="0" x2="800" y2="800" />
        <rect x="560" y="120" width="180" height="180" transform="rotate(15 650 210)" />
        <line x1="120" y1="120" x2="420" y2="360" />
      </g>
    </svg>
  );
}
