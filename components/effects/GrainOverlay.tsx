"use client";

/**
 * CSS-only film grain overlay. Fixed, full-viewport, non-interactive.
 * Uses an inline SVG fractal-noise data URI so there are no asset requests.
 */
const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>`
  );

export default function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9998]"
      style={{
        backgroundImage: `url("${NOISE}")`,
        backgroundRepeat: "repeat",
        opacity: 0.06,
        mixBlendMode: "soft-light",
        animation: "grain-shift 8s steps(6) infinite",
      }}
    />
  );
}
