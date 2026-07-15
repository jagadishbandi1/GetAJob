"use client";

import { useTheme } from "@/components/ThemeProvider";

/**
 * Floating light/dark toggle, bottom-right. Both icons are rendered; CSS keyed
 * off the <html> data-theme attribute shows the correct one (see globals.css),
 * so the first client render always matches the server and there is no
 * hydration mismatch. The sun shows in light mode, the moon in dark mode.
 */
export default function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="toggle color theme"
      className="fixed bottom-5 right-5 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-bg-surface/70 text-accent backdrop-blur transition hover:shadow-[0_0_16px_var(--accent-glow)]"
    >
      {/* moon (dark mode) */}
      <svg
        className="theme-icon-moon h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      {/* sun (light mode) */}
      <svg
        className="theme-icon-sun h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
