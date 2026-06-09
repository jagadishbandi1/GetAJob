"use client";

import { useEffect, useRef, useState } from "react";
import HoverGlow from "@/components/effects/HoverGlow";
import MagneticWrapper from "@/components/effects/MagneticWrapper";
import type { Profile } from "@/hooks/types";

const ACCEPT = ".pdf,.txt,.md,.doc,.docx";

// fields revealed one-by-one after a resume is parsed. each maps to a real
// profile value populated by the /api/upload flow. "experience" surfaces a
// trimmed slice of the extracted resume_text — no placeholder values.
type RevealKey = "full_name" | "email" | "phone" | "location" | "linkedin" | "website" | "experience";

const REVEAL_ORDER: { key: RevealKey; label: string }[] = [
  { key: "full_name", label: "full name" },
  { key: "email", label: "email" },
  { key: "phone", label: "phone" },
  { key: "location", label: "location" },
  { key: "linkedin", label: "linkedin" },
  { key: "website", label: "website" },
  { key: "experience", label: "experience summary" },
];

const REVEAL_INTERVAL = 400;

function valueFor(key: RevealKey, profile: Profile): string {
  if (key === "experience") {
    const text = (profile.resume_text || "").replace(/\s+/g, " ").trim();
    return text.slice(0, 220);
  }
  return profile[key] || "";
}

export default function ResumeParser({
  profile,
  uploading,
  onUpload,
  onSaveProfile,
  setProfile,
  saving,
  saved,
}: {
  profile: Profile;
  uploading: boolean;
  onUpload: (file: File) => Promise<void> | void;
  onSaveProfile: () => void;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  saving: boolean;
  saved: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  // how many fields have been revealed so far; -1 = reveal not running
  const [revealCount, setRevealCount] = useState(-1);

  const parsing = uploading;

  // drive the staggered reveal once parsing finishes. setState lives inside
  // the interval callback (not the effect body) to satisfy the lint rule.
  useEffect(() => {
    if (revealCount < 0) return;
    if (revealCount >= REVEAL_ORDER.length) return;
    const id = setInterval(() => {
      setRevealCount((count) => {
        if (count >= REVEAL_ORDER.length) {
          clearInterval(id);
          return count;
        }
        return count + 1;
      });
    }, REVEAL_INTERVAL);
    return () => clearInterval(id);
  }, [revealCount]);

  async function handleFile(file: File) {
    setFileName(file.name);
    setRevealCount(-1);
    await onUpload(file);
    // kick off the reveal once the new profile data is in
    setRevealCount(0);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const revealing = revealCount >= 0;
  const allRevealed = revealCount >= REVEAL_ORDER.length;

  return (
    <HoverGlow className="p-5">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">resume</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          drop a resume and claude extracts the basics into your profile.
        </p>
      </div>

      <button
        type="button"
        disabled={parsing}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition disabled:opacity-50 ${
          dragOver ? "border-accent bg-bg-elevated" : "border-[var(--border-hover)]"
        }`}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke={dragOver ? "var(--accent)" : "var(--text-muted)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
        <span className="text-sm text-text-primary">
          {parsing ? "parsing resume" : "drop your resume here"}
        </span>
        <span className="text-xs text-text-muted">or click to browse — pdf, txt, md, doc, docx</span>
      </button>

      {fileName && !parsing && (
        <p className="mt-3 text-xs text-accent">{fileName}</p>
      )}

      {revealing && (
        <div className="mt-5 space-y-3">
          {REVEAL_ORDER.map((field, index) => {
            const shown = index < revealCount;
            if (!shown && index !== revealCount) return null;
            const resolved = shown;
            const value = valueFor(field.key, profile);
            return (
              <div
                key={field.key}
                className="rounded-xl border border-border-base bg-bg-surface px-4 py-3 transition-opacity duration-300"
                style={{ opacity: resolved ? 1 : 0.5 }}
              >
                <span className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {field.label}
                </span>
                {!resolved ? (
                  <span className="text-sm text-text-muted">extracting...</span>
                ) : field.key === "experience" ? (
                  <p className="text-sm leading-6 text-text-secondary">
                    {value || "no experience text extracted."}
                  </p>
                ) : (
                  <input
                    className="w-full rounded-lg border border-transparent bg-transparent text-sm text-text-primary outline-none transition focus:border-border-base"
                    value={value}
                    placeholder="not found — click to add"
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                  />
                )}
              </div>
            );
          })}

          {allRevealed && (
            <div className="flex items-center gap-3 pt-1">
              <MagneticWrapper>
                <button
                  type="button"
                  disabled={saving}
                  onClick={onSaveProfile}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
                >
                  {saving ? "saving" : saved ? "saved" : "confirm & save"}
                </button>
              </MagneticWrapper>
              <span className="text-xs text-text-muted">edit any field above before saving.</span>
            </div>
          )}
        </div>
      )}

      {!revealing && profile.resume_file_name && (
        <p className="mt-4 text-xs text-accent">{profile.resume_file_name}</p>
      )}
    </HoverGlow>
  );
}
