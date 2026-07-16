"use client";

import { useEffect, useRef, useState } from "react";
import HoverGlow from "@/components/effects/HoverGlow";
import MagneticWrapper from "@/components/effects/MagneticWrapper";
import type { Profile } from "@/hooks/types";

const ACCEPT = ".pdf,.txt,.md,.doc,.docx";

// structured fields returned by POST /api/parse-resume
interface ParsedResume {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  skills: string;
  experience_summary: string;
}

const EMPTY_PARSED: ParsedResume = {
  full_name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  skills: "",
  experience_summary: "",
};

// contact keys map 1:1 onto the profile; skills + experience_summary have no
// dedicated profile columns so they are folded into free_context on save.
const CONTACT_KEYS = ["full_name", "email", "phone", "location", "linkedin", "website"] as const;
type ContactKey = (typeof CONTACT_KEYS)[number];
type RevealKey = ContactKey | "skills" | "experience_summary";

const REVEAL_ORDER: { key: RevealKey; label: string; multiline?: boolean }[] = [
  { key: "full_name", label: "full name" },
  { key: "email", label: "email" },
  { key: "phone", label: "phone" },
  { key: "location", label: "location" },
  { key: "linkedin", label: "linkedin" },
  { key: "website", label: "website" },
  { key: "skills", label: "skills", multiline: true },
  { key: "experience_summary", label: "experience summary", multiline: true },
];

const REVEAL_INTERVAL = 400;

function isContactKey(key: RevealKey): key is ContactKey {
  return (CONTACT_KEYS as readonly string[]).includes(key);
}

// compose the two non-column fields into free_context so they persist.
function composeContext(parsed: ParsedResume): string {
  return [
    parsed.skills ? `skills: ${parsed.skills}` : "",
    parsed.experience_summary ? `experience: ${parsed.experience_summary}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
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
  const [enriching, setEnriching] = useState(false);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  // how many fields have been revealed so far; -1 = reveal not running
  const [revealCount, setRevealCount] = useState(-1);

  const parsing = uploading || enriching;

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
    setParsed(null);

    // persist the raw resume text + filename (the autofiller reads resume_text)
    await onUpload(file);

    // enrich with structured fields via the dedicated parse route
    setEnriching(true);
    let result: ParsedResume = EMPTY_PARSED;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
      if (res.ok) {
        const data = (await res.json()) as Partial<ParsedResume>;
        result = { ...EMPTY_PARSED, ...data };
      }
    } catch {
      /* fall back to whatever /api/upload already saved to the profile */
    } finally {
      setEnriching(false);
    }

    // seed contact fields from the parse, falling back to the saved profile
    const seeded: ParsedResume = { ...result };
    CONTACT_KEYS.forEach((key) => {
      if (!seeded[key]) seeded[key] = profile[key] || "";
    });
    setParsed(seeded);

    // mirror into the profile so confirm & save persists the extracted data
    setProfile((current) => ({
      ...current,
      full_name: seeded.full_name,
      email: seeded.email,
      phone: seeded.phone,
      location: seeded.location,
      linkedin: seeded.linkedin,
      website: seeded.website,
      free_context: composeContext(seeded) || current.free_context,
    }));

    setRevealCount(0);
  }

  function updateField(key: RevealKey, value: string) {
    if (!parsed) return;
    const next: ParsedResume = { ...parsed, [key]: value };
    setParsed(next);
    if (isContactKey(key)) {
      setProfile((current) => ({ ...current, [key]: value }));
    } else {
      setProfile((current) => ({ ...current, free_context: composeContext(next) }));
    }
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const revealing = revealCount >= 0 && parsed !== null;
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

      {fileName && !parsing && <p className="mt-3 text-xs text-accent">{fileName}</p>}

      {revealing && (
        <div className="mt-5 space-y-3">
          {REVEAL_ORDER.map((field, index) => {
            const shown = index < revealCount;
            if (!shown && index !== revealCount) return null;
            const resolved = shown;
            const value = parsed ? parsed[field.key] : "";
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
                ) : field.multiline ? (
                  <textarea
                    rows={2}
                    className="w-full resize-none rounded-lg border border-transparent bg-transparent text-sm leading-6 text-text-secondary outline-none transition focus:border-border-base"
                    value={value}
                    placeholder="not found — click to add"
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                ) : (
                  <input
                    className="w-full rounded-lg border border-transparent bg-transparent text-sm text-text-primary outline-none transition focus:border-border-base"
                    value={value}
                    placeholder="not found — click to add"
                    onChange={(event) => updateField(field.key, event.target.value)}
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
