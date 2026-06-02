"use client";

import { useRef } from "react";
import HoverGlow from "@/components/effects/HoverGlow";
import type { Document } from "@/hooks/types";

export default function DocumentsList({
  documents,
  uploading,
  onUpload,
  onDelete,
}: {
  documents: Document[];
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: (id: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <HoverGlow className="p-5">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.pdf,.doc,.docx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">documents</p>
          <p className="mt-2 text-sm text-text-secondary">cover letters, portfolios, certifications, and snippets.</p>
        </div>
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="rounded-xl border border-border-base px-4 py-2 text-sm text-text-primary disabled:opacity-50">
          {uploading ? "uploading" : "add"}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {documents.length === 0 && <p className="text-sm text-text-muted">no documents yet.</p>}
        {documents.map((document) => (
          <div key={document.id} className="flex items-center justify-between gap-4 rounded-xl border border-border-base bg-bg-elevated px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-text-primary">{document.name}</p>
              <p className="mt-1 truncate text-xs text-text-muted">{document.preview}</p>
            </div>
            <button type="button" onClick={() => onDelete(document.id)} className="text-xs text-text-muted">remove</button>
          </div>
        ))}
      </div>
    </HoverGlow>
  );
}

