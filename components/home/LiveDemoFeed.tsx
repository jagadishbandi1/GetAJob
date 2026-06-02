import HoverGlow from "@/components/effects/HoverGlow";

const labels: Record<string, string> = {
  running: "running",
  done: "done",
  failed: "failed",
  pending: "pending",
};

export default function LiveDemoFeed({
  status,
  log,
}: {
  status: string;
  log: string;
}) {
  const lines = log ? log.split("\n").filter(Boolean) : [];

  return (
    <HoverGlow className="mt-4 p-4 text-left">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border border-border-hover px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
          {labels[status] || "idle"}
        </span>
        {status === "running" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
      </div>
      <div className="max-h-56 overflow-y-auto font-mono text-xs leading-6 text-text-secondary">
        {lines.length === 0 ? (
          <p className="text-text-muted">paste a url above to start.</p>
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

