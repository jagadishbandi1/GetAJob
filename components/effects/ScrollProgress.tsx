"use client";

import { useEffect, useState } from "react";

/** Fixed 2px sage bar at the top; width tracks scroll progress. */
export default function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed left-0 top-0 z-[9999] h-0.5"
      style={{ width: `${pct}%`, background: "var(--accent)", transition: "width 0.1s linear" }}
    />
  );
}
