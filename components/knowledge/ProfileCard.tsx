"use client";

import HoverGlow from "@/components/effects/HoverGlow";
import MagneticWrapper from "@/components/effects/MagneticWrapper";
import type { Profile } from "@/hooks/types";

const fields = ["full_name", "email", "phone", "location", "linkedin", "website"] as const;

export default function ProfileCard({
  profile,
  setProfile,
  saving,
  saved,
  onSave,
}: {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <HoverGlow className="p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">profile</p>
          <p className="mt-2 text-sm text-text-secondary">click into any field and edit inline.</p>
        </div>
        <MagneticWrapper>
          <button type="button" disabled={saving} onClick={onSave} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50">
            {saving ? "saving" : saved ? "saved" : "save"}
          </button>
        </MagneticWrapper>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field} className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-text-muted">{field.replace("_", " ")}</span>
            <input
              className="w-full rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent"
              value={profile[field] || ""}
              onChange={(event) => setProfile((value) => ({ ...value, [field]: event.target.value }))}
            />
          </label>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-text-muted">free context</span>
        <textarea
          className="min-h-32 w-full resize-none rounded-xl border border-border-base bg-bg-surface px-4 py-3 text-sm leading-6 text-text-primary outline-none transition focus:border-accent"
          value={profile.free_context || ""}
          onChange={(event) => setProfile((value) => ({ ...value, free_context: event.target.value }))}
          placeholder="remote only, salary expectations, tone, constraints, things to avoid..."
        />
      </label>
    </HoverGlow>
  );
}

