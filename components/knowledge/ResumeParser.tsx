"use client";

import { useRef } from "react";
import HoverGlow from "@/components/effects/HoverGlow";
import MagneticWrapper from "@/components/effects/MagneticWrapper";
import type { Profile } from "@/hooks/types";

export default function ResumeParser({
  profile,
  uploading,
  onUpload,
}: {
  profile: Profile;
  uploading: boolean;
  onUpload: (file: File) => void;
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">resume</p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            upload a resume and claude extracts the basics into your profile.
          </p>
          {profile.resume_file_name && <p className="mt-2 text-xs text-accent">{profile.resume_file_name}</p>}
        </div>
        <MagneticWrapper>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-border-base px-4 py-2 text-sm text-text-primary disabled:opacity-50"
          >
            {uploading ? "parsing" : "upload resume"}
          </button>
        </MagneticWrapper>
      </div>
      {profile.resume_text && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-text-muted">{profile.resume_text}</p>
      )}
    </HoverGlow>
  );
}

