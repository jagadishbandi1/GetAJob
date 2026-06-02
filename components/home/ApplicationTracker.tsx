"use client";

import { useState } from "react";
import HoverGlow from "@/components/effects/HoverGlow";
import MagneticWrapper from "@/components/effects/MagneticWrapper";
import ScrollReveal from "@/components/effects/ScrollReveal";
import SectionHeader from "@/components/layout/SectionHeader";
import Skeleton from "@/components/layout/Skeleton";
import type { Application, Health } from "@/hooks/types";

const statusLabel: Record<string, string> = {
  pending: "pending",
  running: "running",
  done: "applied",
  failed: "failed",
  interviewing: "interviewing",
  offer: "offer",
  rejected: "rejected",
};

const nextStatuses: Record<string, string[]> = {
  done: ["interviewing", "rejected"],
  interviewing: ["offer", "rejected"],
};

export default function ApplicationTracker({
  applications,
  loading,
  addingApp,
  setAddingApp,
  newApp,
  setNewApp,
  gmailConnected,
  gmailSyncing,
  gmailSyncResult,
  health,
  onSyncGmail,
  onAddManual,
  onDelete,
  onUpdateStatus,
}: {
  applications: Application[];
  loading: boolean;
  addingApp: boolean;
  setAddingApp: (value: boolean | ((value: boolean) => boolean)) => void;
  newApp: { job_url: string; company: string; job_title: string; location: string; compensation: string; status: string };
  setNewApp: React.Dispatch<React.SetStateAction<{ job_url: string; company: string; job_title: string; location: string; compensation: string; status: string }>>;
  gmailConnected: boolean;
  gmailSyncing: boolean;
  gmailSyncResult: string | null;
  health: Health | null;
  onSyncGmail: () => void;
  onAddManual: () => void;
  onDelete: (id: number) => void;
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const [showFailed, setShowFailed] = useState(false);
  const activeApps = applications.filter((app) => app.status !== "failed");
  const failedApps = applications.filter((app) => app.status === "failed");

  return (
    <section className="relative z-10 mx-auto max-w-4xl px-5 pb-24 pt-32">
      <SectionHeader eyebrow="applications" title="job tracker" sub="every application, tracked automatically." />
      <GmailCard
        connected={gmailConnected}
        syncing={gmailSyncing}
        result={gmailSyncResult}
        enabled={!!health?.gmail}
        onSync={onSyncGmail}
      />
      <ManualApplicationForm
        adding={addingApp}
        setAdding={setAddingApp}
        app={newApp}
        setApp={setNewApp}
        onSave={onAddManual}
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <HoverGlow key={item} className="p-5">
              <Skeleton className="mb-3 h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </HoverGlow>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {activeApps.length === 0 && failedApps.length === 0 && (
            <EmptyState text="no applications yet. paste a job url on home, or log one manually above." />
          )}
          {activeApps.map((app) => (
            <ApplicationCard key={app.id} app={app} onDelete={onDelete} onUpdateStatus={onUpdateStatus} />
          ))}
          {failedApps.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowFailed((value) => !value)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--red-border)] bg-[var(--red-bg)] px-4 py-3 text-sm text-[var(--red)]"
              >
                {failedApps.length} failed attempt{failedApps.length === 1 ? "" : "s"}
                <span>{showFailed ? "hide" : "show"}</span>
              </button>
              {showFailed && (
                <div className="mt-3 space-y-3">
                  {failedApps.map((app) => (
                    <ApplicationCard key={app.id} app={app} onDelete={onDelete} onUpdateStatus={onUpdateStatus} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function GmailCard({
  connected,
  syncing,
  result,
  enabled,
  onSync,
}: {
  connected: boolean;
  syncing: boolean;
  result: string | null;
  enabled: boolean;
  onSync: () => void;
}) {
  return (
    <ScrollReveal className="mb-5">
      <HoverGlow className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">
              gmail sync
              {connected && <span className="ml-2 rounded border border-border-hover px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-accent">connected</span>}
            </p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              import application confirmations, status updates, and interview invites.
            </p>
            {result && <p className="mt-2 text-xs text-accent">{result}</p>}
          </div>
          {connected ? (
            <MagneticWrapper>
              <button type="button" onClick={onSync} disabled={syncing} className="rounded-xl border border-border-base px-4 py-2 text-sm text-text-primary disabled:opacity-50">
                {syncing ? "syncing" : "sync now"}
              </button>
            </MagneticWrapper>
          ) : (
            <a className={`rounded-xl border border-border-base px-4 py-2 text-sm ${enabled ? "text-text-primary" : "pointer-events-none text-text-muted"}`} href="/api/auth/google">
              connect gmail
            </a>
          )}
        </div>
      </HoverGlow>
    </ScrollReveal>
  );
}

function ManualApplicationForm({
  adding,
  setAdding,
  app,
  setApp,
  onSave,
}: {
  adding: boolean;
  setAdding: (value: boolean | ((value: boolean) => boolean)) => void;
  app: { job_url: string; company: string; job_title: string; location: string; compensation: string; status: string };
  setApp: React.Dispatch<React.SetStateAction<{ job_url: string; company: string; job_title: string; location: string; compensation: string; status: string }>>;
  onSave: () => void;
}) {
  return (
    <ScrollReveal className="mb-5">
      <div className="mb-3 flex justify-end">
        <button type="button" onClick={() => setAdding((value) => !value)} className="rounded-xl border border-border-base px-4 py-2 text-sm text-text-primary">
          {adding ? "cancel" : "log manually"}
        </button>
      </div>
      {adding && (
        <HoverGlow className="p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm" placeholder="job url" value={app.job_url} onChange={(event) => setApp((value) => ({ ...value, job_url: event.target.value }))} />
            <input className="rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm" placeholder="company" value={app.company} onChange={(event) => setApp((value) => ({ ...value, company: event.target.value }))} />
            <input className="rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm" placeholder="role" value={app.job_title} onChange={(event) => setApp((value) => ({ ...value, job_title: event.target.value }))} />
            <input className="rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm" placeholder="location" value={app.location} onChange={(event) => setApp((value) => ({ ...value, location: event.target.value }))} />
            <input className="rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm" placeholder="compensation" value={app.compensation} onChange={(event) => setApp((value) => ({ ...value, compensation: event.target.value }))} />
            <select className="rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm" value={app.status} onChange={(event) => setApp((value) => ({ ...value, status: event.target.value }))}>
              <option value="done">applied</option>
              <option value="interviewing">interviewing</option>
              <option value="offer">offer</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="rounded-xl border border-border-base px-4 py-2 text-sm text-text-primary">cancel</button>
            <button type="button" onClick={onSave} disabled={!app.job_url} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40">save</button>
          </div>
        </HoverGlow>
      )}
    </ScrollReveal>
  );
}

function ApplicationCard({
  app,
  onDelete,
  onUpdateStatus,
}: {
  app: Application;
  onDelete: (id: number) => void;
  onUpdateStatus: (id: number, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const domain = getDomain(app.job_url);
  const transitions = nextStatuses[app.status] || [];

  return (
    <ScrollReveal>
      <HoverGlow className="p-0">
        <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{app.job_title || app.company || domain}</p>
            <p className="mt-1 truncate text-xs text-text-secondary">{[app.company, app.location, app.compensation].filter(Boolean).join(" / ") || domain}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-full border border-border-hover px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-accent">{statusLabel[app.status] || app.status}</span>
            <span className="hidden text-xs text-text-muted sm:inline">{app.applied_at?.slice(0, 10)}</span>
          </div>
        </button>
        {expanded && (
          <div className="border-t border-border-base px-5 pb-5 pt-4">
            {app.job_url && <a href={app.job_url} target="_blank" rel="noreferrer" className="block truncate text-xs text-accent">{app.job_url}</a>}
            {transitions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {transitions.map((status) => (
                  <button key={status} type="button" onClick={() => onUpdateStatus(app.id, status)} className="rounded-lg border border-border-base px-3 py-1.5 text-xs text-text-primary">
                    move to {statusLabel[status]}
                  </button>
                ))}
              </div>
            )}
            {app.log && <pre className="mt-4 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-6 text-text-secondary">{app.log}</pre>}
            <button type="button" onClick={() => onDelete(app.id)} className="mt-4 text-xs text-[var(--red)]">remove</button>
          </div>
        )}
      </HoverGlow>
    </ScrollReveal>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-text-secondary">{text}</p>
    </div>
  );
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url || "unknown";
  }
}

