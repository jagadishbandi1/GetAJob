"use client";

import GeometricBg from "@/components/effects/GeometricBg";
import MagneticWrapper from "@/components/effects/MagneticWrapper";
import ScrollReveal from "@/components/effects/ScrollReveal";
import type { Health } from "@/hooks/types";
import HowItWorks from "./HowItWorks";
import LiveDemoFeed from "./LiveDemoFeed";
import StatsRow from "./StatsRow";

export default function HeroSection({
  jobUrl,
  setJobUrl,
  applying,
  appStatus,
  appLog,
  profileWarning,
  health,
  gmailConnected,
  stats,
  onApply,
  onGoToKnowledge,
}: {
  jobUrl: string;
  setJobUrl: (value: string) => void;
  applying: boolean;
  appStatus: string;
  appLog: string;
  profileWarning: boolean;
  health: Health | null;
  gmailConnected: boolean;
  stats: { applications: number; documents: number; training: number };
  onApply: () => void;
  onGoToKnowledge: () => void;
}) {
  return (
    <section className="relative flex min-h-screen flex-col items-center overflow-hidden px-5 pb-24 pt-[20vh] text-center">
      <GeometricBg />
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        <ScrollReveal>
          <h1 className="pb-2 text-[clamp(3.25rem,10vw,7.5rem)] leading-[1.05] text-text-primary">
            get a job <span className="italic text-accent">faster.</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mt-5 max-w-md text-sm leading-7 text-text-secondary sm:text-base">
            i was bored of copy-pasting my resume into the same 47 fields on every job site, so i built this instead.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={180} className="mt-10 w-full max-w-2xl">
          {profileWarning && (
            <div className="mb-3 rounded-xl border border-[var(--amber-border)] bg-[var(--amber-bg)] px-4 py-3 text-left text-sm text-[var(--amber)]">
              your profile is empty.{" "}
              <button type="button" onClick={onGoToKnowledge} className="underline">
                add your resume first
              </button>
              .
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="h-12 flex-1 rounded-2xl border border-border-base bg-bg-surface px-5 text-sm text-text-primary outline-none transition focus:border-accent"
              placeholder="paste a job url"
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !applying) onApply();
              }}
            />
            <MagneticWrapper className="shrink-0">
              <button
                type="button"
                onClick={onApply}
                disabled={applying || !jobUrl.trim()}
                className="h-12 whitespace-nowrap rounded-2xl bg-accent px-8 text-sm font-semibold text-bg transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applying ? "running…" : "apply now"}
              </button>
            </MagneticWrapper>
          </div>
          <LiveDemoFeed status={appStatus} log={appLog} />
        </ScrollReveal>

        <SystemStatus health={health} gmailConnected={gmailConnected} />
        <StatsRow {...stats} />
        {stats.applications === 0 && <HowItWorks />}
      </div>
    </section>
  );
}

function SystemStatus({ health, gmailConnected }: { health: Health | null; gmailConnected: boolean }) {
  if (!health) return null;
  const items = [
    ["claude", health.ai],
    ["database", health.database],
    ["playwright", health.playwright],
    ["gmail", health.gmail || gmailConnected],
  ] as const;

  return (
    <ScrollReveal delay={260} className="mt-10 flex flex-wrap justify-center gap-5">
      {items.map(([label, active]) => (
        <div key={label} className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-border-hover"}`} />
          <span className={`text-[11px] uppercase tracking-[0.14em] ${active ? "text-text-secondary" : "text-text-muted"}`}>
            {label}
          </span>
        </div>
      ))}
    </ScrollReveal>
  );
}

