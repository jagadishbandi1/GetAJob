import HoverGlow from "@/components/effects/HoverGlow";

export default function PhotoSection() {
  return (
    <section className="mx-auto max-w-2xl">
      <HoverGlow className="p-5">
        {/*
          large photo card. drop a real <img> in place of the placeholder below
          and the hover-reveal still works: the image sits desaturated + sage-tinted
          at rest and animates to full color on hover via the grayscale/sepia filter.
        */}
        <div className="group/photo relative aspect-[4/3] overflow-hidden rounded-xl border border-border-base bg-bg-elevated">
          {/* placeholder box — replace with <img className="h-full w-full object-cover ..." /> */}
          <div className="flex h-full w-full items-center justify-center grayscale-[0.6] sepia-[0.25] saturate-150 transition-[filter] duration-700 ease-out group-hover/photo:grayscale-0 group-hover/photo:sepia-0 group-hover/photo:saturate-100">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
              [ your photo ]
            </span>
          </div>
          {/* sage tint overlay — fades out on hover to reveal full color */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-100 mix-blend-color transition-opacity duration-700 ease-out group-hover/photo:opacity-0"
            style={{ background: "var(--accent)" }}
          />
        </div>
        <p className="mt-4 max-w-prose text-sm leading-6 text-text-secondary">
          that&apos;s me and my brother. this website is inspired by my outfit in this
          picture. the sage green, the black, the vibe. a real representation of who i
          am.
        </p>
      </HoverGlow>
    </section>
  );
}
