"use client";

import { useState } from "react";
import HoverGlow from "@/components/effects/HoverGlow";
import type { Rule } from "@/hooks/types";

export default function AnswerRules({
  rules,
  onAdd,
  onDelete,
}: {
  rules: Rule[];
  onAdd: (rule: { trigger_keyword: string; response: string }) => void;
  onDelete: (id: number) => void;
}) {
  const [draft, setDraft] = useState({ trigger_keyword: "", response: "" });

  const add = () => {
    if (!draft.trigger_keyword || !draft.response) return;
    onAdd(draft);
    setDraft({ trigger_keyword: "", response: "" });
  };

  return (
    <HoverGlow className="p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">answer rules</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">keyword to response pairs for questions that need exact wording.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input className="rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm" placeholder="keyword" value={draft.trigger_keyword} onChange={(event) => setDraft((value) => ({ ...value, trigger_keyword: event.target.value }))} />
        <input className="rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm" placeholder="response" value={draft.response} onChange={(event) => setDraft((value) => ({ ...value, response: event.target.value }))} onKeyDown={(event) => event.key === "Enter" && add()} />
        <button type="button" onClick={add} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg">add</button>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        {rules.length === 0 && <p className="text-sm text-text-muted">no custom rules yet.</p>}
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between gap-4 rounded-xl border border-border-base bg-bg-elevated px-4 py-3">
            <div className="min-w-0 text-sm">
              <span className="rounded border border-border-hover px-2 py-1 text-xs text-accent">{rule.trigger_keyword}</span>
              <span className="mx-2 text-text-muted">to</span>
              <span className="text-text-secondary">{rule.response}</span>
            </div>
            <button type="button" onClick={() => onDelete(rule.id)} className="text-xs text-text-muted">remove</button>
          </div>
        ))}
      </div>
    </HoverGlow>
  );
}

