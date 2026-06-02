import HoverGlow from "@/components/effects/HoverGlow";
import ScrollReveal from "@/components/effects/ScrollReveal";

const steps = [
  ["01", "teach it about you", "upload your resume, documents, and answer rules once."],
  ["02", "paste a job url", "the app reads the posting and maps your profile to the form."],
  ["03", "review and submit", "playwright fills the browser; you stay in control of submit."],
];

export default function HowItWorks() {
  return (
    <ScrollReveal className="mt-12 grid w-full max-w-4xl gap-3 md:grid-cols-3">
      {steps.map(([number, title, body]) => (
        <HoverGlow key={number} className="p-5" radius={12}>
          <p className="mb-8 font-mono text-xs text-accent">{number}</p>
          <h3 className="mb-3 font-mono text-sm font-semibold tracking-normal text-text-primary">{title}</h3>
          <p className="text-sm leading-6 text-text-secondary">{body}</p>
        </HoverGlow>
      ))}
    </ScrollReveal>
  );
}

