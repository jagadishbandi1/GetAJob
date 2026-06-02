"use client";

import { useEffect, useRef } from "react";

/**
 * Sage dot follows the cursor exactly; a larger ring trails with a 0.1 lerp.
 * Ring expands over interactive elements. Native cursor is hidden in globals.css
 * (fine-pointer devices only). Elements are hidden via CSS on touch devices and
 * the effect attaches no listeners there.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: target.x, y: target.y };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.x}px, ${target.y}px)`;
      }
    };

    const isInteractive = (el: Element | null) =>
      !!el?.closest('a, button, input, textarea, select, [data-magnetic], [role="button"]');

    const onOver = (e: MouseEvent) => {
      ringRef.current?.classList.toggle(
        "cursor-ring--active",
        isInteractive(e.target as Element)
      );
    };

    const tick = () => {
      ring.x += (target.x - ring.x) * 0.1;
      ring.y += (target.y - ring.y) * 0.1;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="custom-cursor">
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "var(--accent)", marginLeft: -3, marginTop: -3 }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[10000] rounded-full"
        style={{
          width: 36,
          height: 36,
          marginLeft: -18,
          marginTop: -18,
          border: "1px solid var(--accent)",
          opacity: 0.5,
          transition: "width 0.2s ease, height 0.2s ease, margin 0.2s ease, opacity 0.2s ease",
        }}
      />
      <style>{`
        .cursor-ring--active {
          width: 52px !important;
          height: 52px !important;
          margin-left: -26px !important;
          margin-top: -26px !important;
          opacity: 0.8 !important;
        }
        @media (pointer: coarse) {
          .custom-cursor { display: none; }
        }
      `}</style>
    </div>
  );
}
