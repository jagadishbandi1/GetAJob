"use client";

import HoverGlow from "@/components/effects/HoverGlow";
import ScrollReveal from "@/components/effects/ScrollReveal";
import SectionHeader from "@/components/layout/SectionHeader";
import Skeleton from "@/components/layout/Skeleton";
import type { TrainingExample } from "@/hooks/types";

export default function TrainingData({
  training,
  loading,
  onDelete,
}: {
  training: TrainingExample[];
  loading: boolean;
  onDelete: (id?: number) => void;
}) {
  return (
    <section className="relative z-10 mx-auto max-w-4xl px-5 pb-24 pt-32">
      <SectionHeader eyebrow="memory" title="training data" sub={`${training.length} answer${training.length === 1 ? "" : "s"} remembered.`} />
      {training.length > 0 && (
        <div className="mb-6 text-center">
          <button type="button" onClick={() => onDelete()} className="text-xs text-[var(--red)]">clear all training data</button>
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <HoverGlow key={item} className="p-4">
              <Skeleton className="mb-3 h-3 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </HoverGlow>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {training.length === 0 && <p className="py-20 text-center text-sm text-text-secondary">no training data yet.</p>}
          {training.map((example) => (
            <ScrollReveal key={example.id}>
              <HoverGlow className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-text-muted">{example.question_text}</p>
                    <p className="mt-2 text-sm text-text-primary">{example.answer_given}</p>
                    {example.job_url && <p className="mt-2 truncate text-xs text-text-muted">{example.job_url}</p>}
                  </div>
                  <button type="button" onClick={() => onDelete(example.id)} className="shrink-0 text-sm text-text-muted">remove</button>
                </div>
              </HoverGlow>
            </ScrollReveal>
          ))}
        </div>
      )}
    </section>
  );
}

