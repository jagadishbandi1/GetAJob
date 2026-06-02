import ScrollReveal from "@/components/effects/ScrollReveal";

export default function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <ScrollReveal className="mb-12 text-center">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="mx-auto max-w-3xl text-4xl leading-tight text-text-primary sm:text-5xl">{title}</h2>
      {sub && <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-secondary">{sub}</p>}
    </ScrollReveal>
  );
}

