"use client";

import { useEffect, useRef, useState } from "react";
import HoverGlow from "@/components/effects/HoverGlow";

const labels: Record<string, string> = {
  running: "running",
  done: "done",
  failed: "failed",
  pending: "pending",
  demo: "demo",
};

// label + value pairs for the idle demo. value is rendered in accent (sage),
// the rest of the line in muted. "->" is used instead of an arrow glyph.
type DemoLine = { label: string; value?: string };

const demoLines: DemoLine[] = [
  { label: "navigating to greenhouse.io/jobs/senior-frontend..." },
  { label: "found 14 form fields on page" },
  { label: 'filling "full name" ->', value: "jagdish bandi" },
  { label: 'filling "email" ->', value: "jagadishbandi1@gmail.com" },
  { label: 'thinking about "years of experience"...' },
  { label: 'filling "years of experience" ->', value: "3" },
  { label: "uploading resume.pdf..." },
  { label: "done. 14/14 fields filled." },
];

const LINE_DELAY = 800;
const HOLD_AFTER = 3000;
const FADE_DURATION = 600;

function IdleDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [fading, setFading] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let cancelled = false;

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.current.push(id);
    };

    const runCycle = () => {
      setFading(false);
      setVisibleCount(0);

      demoLines.forEach((_, index) => {
        schedule(() => setVisibleCount(index + 1), LINE_DELAY * (index + 1));
      });

      const allShownAt = LINE_DELAY * (demoLines.length + 1);
      schedule(() => setFading(true), allShownAt + HOLD_AFTER);
      schedule(runCycle, allShownAt + HOLD_AFTER + FADE_DURATION);
    };

    runCycle();

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  return (
    <div
      className="transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1 }}
    >
      {demoLines.slice(0, visibleCount).map((line, index) => (
        <p key={index} className="animate-[feed-pulse_0.3s_ease]">
          <span className="text-accent">{">"}</span>{" "}
          <span className="text-text-muted">{line.label}</span>
          {line.value && <span className="text-accent"> {line.value}</span>}
        </p>
      ))}
      <span className="inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-accent" aria-hidden />
    </div>
  );
}

export default function LiveDemoFeed({
  status,
  log,
}: {
  status: string;
  log: string;
}) {
  const lines = log ? log.split("\n").filter(Boolean) : [];
  const isTerminal = status === "running" || status === "done" || status === "failed" || status === "demo";
  const isIdle = lines.length === 0 && !isTerminal;

  return (
    <HoverGlow className="mt-4 p-4 text-left">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border border-border-hover px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
          {labels[status] || "idle"}
        </span>
        {status === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
      </div>
      <div className="max-h-56 overflow-y-auto font-mono text-xs leading-6 text-text-secondary">
        {isIdle ? (
          <IdleDemo />
        ) : (
          lines.map((line, index) => (
            <p key={`${line}-${index}`} className="animate-[feed-pulse_0.2s_ease]">
              <span className="text-accent">›</span> {line}
            </p>
          ))
        )}
      </div>
    </HoverGlow>
  );
}
