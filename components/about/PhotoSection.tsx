import HoverGlow from "@/components/effects/HoverGlow";

export default function PhotoSection() {
  return (
    <HoverGlow className="p-5">
      <div className="aspect-[4/3] rounded-xl border border-border-base bg-bg-elevated" />
      <p className="mt-4 text-sm leading-6 text-text-secondary">
        that&apos;s me and my brother. this website is inspired by my outfit in this picture. the sage green, the black, the vibe.
      </p>
    </HoverGlow>
  );
}

