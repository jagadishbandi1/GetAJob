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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 pb-20 pt-28 text-center">
      <GeometricBg />
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        <ScrollReveal>
          <h1 className="text-[clamp(4rem,12vw,9rem)] leading-[0.9] text-text-primary">
            get a job <span className="italic text-accent">faster.</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="mt-6 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">
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
              className="min-h-12 flex-1 rounded-2xl border border-border-base bg-bg-surface px-5 text-sm text-text-primary outline-none transition focus:border-accent"
              placeholder="paste a job url"
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !applying) onApply();
              }}
            />
            <MagneticWrapper>
              <button
                type="button"
                onClick={onApply}
                disabled={applying || !jobUrl.trim()}
                className="min-h-12 rounded-2xl bg-accent px-7 text-sm font-semibold text-bg transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                {applying ? "running" : "apply now"}
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

