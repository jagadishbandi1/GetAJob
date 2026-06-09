"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import type { Application } from "@/hooks/types";

const statusLabel: Record<string, string> = {
  pending: "pending",
  running: "running",
  done: "applied",
  failed: "rejected",
  interviewing: "interviewing",
  offer: "offer",
  rejected: "rejected",
};

// status badges map to the existing color tokens.
const statusBadgeClass: Record<string, string> = {
  done: "border-border-hover text-accent",
  interviewing: "border-[var(--amber-border)] text-[var(--amber)]",
  offer: "border-border-hover text-accent",
  rejected: "border-[var(--red-border)] text-[var(--red)]",
  failed: "border-[var(--red-border)] text-[var(--red)]",
  pending: "border-border-base text-text-muted",
  running: "border-border-hover text-accent",
};

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url || "unknown";
  }
}

export default function RecentApplications() {
  const { applications } = useApp();
  const [expanded, setExpanded] = useState(false);

  if (applications.length === 0) return null;

  return (
    <div className="mt-4 text-left">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-2xl border border-border-base bg-bg-surface px-5 py-3 text-sm text-text-primary transition hover:border-border-hover"
      >
        <span className="font-mono">
          {applications.length} application{applications.length === 1 ? "" : "s"}
        </span>
        <span
          className={`block h-2 w-2 rotate-45 border-b border-r border-text-secondary transition-transform duration-300 ${
            expanded ? "-translate-y-0.5 rotate-[225deg]" : ""
          }`}
          aria-hidden
        />
      </button>

      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <ul className="mt-3 space-y-2">
            {applications.map((app) => (
              <RecentRow key={app.id} app={app} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function RecentRow({ app }: { app: Application }) {
  const domain = getDomain(app.job_url);
  const title = app.job_title || app.company || domain;
  const sub = [app.company, app.location].filter(Boolean).join(" / ") || domain;
  const badge = statusBadgeClass[app.status] || "border-border-base text-text-muted";

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-border-base bg-bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-text-primary">{title}</p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">{sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${badge}`}>
          {statusLabel[app.status] || app.status}
        </span>
        <span className="hidden font-mono text-xs text-text-muted sm:inline">
          {app.applied_at?.slice(0, 10)}
        </span>
      </div>
    </li>
  );
}
