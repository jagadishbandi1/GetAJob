"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import type { Application } from "@/hooks/types";

// user-facing pipeline stages the tracker lets you set. each maps to an
// existing VALID_STATUS so we never need a schema migration:
//   applied -> 'done', interviewing -> 'interviewing', offer -> 'offer',
//   rejected -> 'rejected'.
const USER_STATUSES: { value: string; label: string; send: string }[] = [
  { value: "applied", label: "applied", send: "done" },
  { value: "interviewing", label: "interviewing", send: "interviewing" },
  { value: "offer", label: "offer", send: "offer" },
  { value: "rejected", label: "rejected", send: "rejected" },
];

// stored status -> the manageable select value (empty when the row is in a
// state the user doesn't set by hand, e.g. running/pending/failed).
function toSelectValue(status: string): string {
  switch (status) {
    case "done":
    case "review":
      return "applied";
    case "interviewing":
      return "interviewing";
    case "offer":
      return "offer";
    case "rejected":
      return "rejected";
    default:
      return "";
  }
}

// stored status -> the label shown on the badge (always visible).
function displayLabel(status: string): string {
  switch (status) {
    case "done":
    case "review":
      return "applied";
    case "running":
    case "pending":
      return "in progress";
    case "failed":
    case "demo":
      return "attempted";
    default:
      return status;
  }
}

// badge colors reuse the existing status tokens.
function badgeClass(status: string): string {
  switch (status) {
    case "interviewing":
      return "border-[var(--amber-border)] text-[var(--amber)]";
    case "rejected":
    case "failed":
    case "demo":
      return "border-[var(--red-border)] text-[var(--red)]";
    case "done":
    case "review":
    case "offer":
    case "running":
      return "border-border-hover text-accent";
    default:
      return "border-border-base text-text-muted";
  }
}

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

  const summary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of applications) {
      const label = displayLabel(app.status);
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    // stable, pipeline-ordered summary.
    const order = ["applied", "interviewing", "offer", "rejected", "in progress", "attempted"];
    return order
      .filter((label) => counts.has(label))
      .map((label) => `${counts.get(label)} ${label}`)
      .join(" · ");
  }, [applications]);

  if (applications.length === 0) return null;

  return (
    <div className="mt-4 text-left">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-2xl border border-border-base bg-bg-surface px-5 py-3 text-sm text-text-primary transition hover:border-border-hover"
      >
        <span className="min-w-0 truncate">
          <span className="font-mono">
            {applications.length} application{applications.length === 1 ? "" : "s"}
          </span>
          {summary && (
            <span className="ml-3 text-xs text-text-muted">{summary}</span>
          )}
        </span>
        <span
          className={`ml-3 block h-2 w-2 shrink-0 rotate-45 border-b border-r border-text-secondary transition-transform duration-300 ${
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
  const { updateAppStatus } = useApp();
  const domain = getDomain(app.job_url);
  const title = app.job_title || app.company || domain;
  const sub = [app.company, app.location].filter(Boolean).join(" / ") || domain;
  const selectValue = toSelectValue(app.status);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = USER_STATUSES.find((s) => s.value === event.target.value);
    if (!next || next.send === app.status) return;
    void updateAppStatus(app.id, next.send);
  }

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-border-base bg-bg-surface px-4 py-3 transition hover:border-border-hover">
      <div className="min-w-0">
        <p className="truncate text-sm text-text-primary">{title}</p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">{sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${badgeClass(app.status)}`}
        >
          {displayLabel(app.status)}
        </span>
        <label className="relative">
          <span className="sr-only">change status for {title}</span>
          <select
            value={selectValue}
            onChange={handleChange}
            className="cursor-pointer appearance-none rounded-lg border border-border-base bg-bg px-3 py-1.5 pr-7 font-mono text-xs text-text-secondary transition hover:border-border-hover focus:border-accent focus:outline-none"
          >
            {selectValue === "" && (
              <option value="" disabled>
                set stage
              </option>
            )}
            {USER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-2.5 top-1/2 block h-1.5 w-1.5 -translate-y-[3px] rotate-45 border-b border-r border-text-muted"
            aria-hidden
          />
        </label>
        <span className="hidden font-mono text-xs text-text-muted sm:inline">
          {app.applied_at?.slice(0, 10)}
        </span>
      </div>
    </li>
  );
}
