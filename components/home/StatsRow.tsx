import ScrollReveal from "@/components/effects/ScrollReveal";

export default function StatsRow({
  applications,
  documents,
  training,
}: {
  applications: number;
  documents: number;
  training: number;
}) {
  if (applications === 0 && documents === 0 && training === 0) return null;

  const stats = [
    { label: "applications", value: applications },
    { label: "documents", value: documents },
    { label: "trained answers", value: training },
  ];

  return (
    <ScrollReveal className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="font-mono text-4xl font-semibold text-accent">{stat.value}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-text-muted">{stat.label}</p>
        </div>
      ))}
    </ScrollReveal>
  );
}

