"use client";

import HoverGlow from "@/components/effects/HoverGlow";
import MagneticWrapper from "@/components/effects/MagneticWrapper";

export default function GmailSection({
  connected,
  syncing,
  syncResult,
  isDemo,
  onSync,
}: {
  connected: boolean;
  syncing: boolean;
  syncResult: string | null;
  isDemo: boolean;
  onSync: () => void;
}) {
  return (
    <HoverGlow className="p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">gmail</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          connect gmail to auto-update application statuses from recruiter emails.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isDemo ? (
          <p className="text-xs text-text-muted">
            gmail is disabled on the live demo — clone and run locally to connect.
          </p>
        ) : connected ? (
          <>
            <span className="rounded-full border border-accent/40 px-3 py-1 text-xs text-accent">connected</span>
            <MagneticWrapper>
              <button
                type="button"
                disabled={syncing}
                onClick={onSync}
                className="rounded-xl border border-border-hover px-4 py-2 text-sm text-text-primary transition hover:border-accent disabled:opacity-50"
              >
                {syncing ? "syncing..." : "sync applications"}
              </button>
            </MagneticWrapper>
          </>
        ) : (
          <MagneticWrapper>
            <a
              href="/api/auth/google"
              className="inline-block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
            >
              connect gmail
            </a>
          </MagneticWrapper>
        )}
      </div>

      {syncResult && (
        <p className={`mt-4 text-xs ${syncResult.includes("failed") || syncResult.includes("disabled") ? "text-[var(--red)]" : "text-text-muted"}`}>
          {syncResult}
        </p>
      )}
    </HoverGlow>
  );
}
