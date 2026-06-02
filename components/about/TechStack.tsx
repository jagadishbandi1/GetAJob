const stack = ["next.js", "api routes", "claude api", "playwright", "neon postgres"];

export default function TechStack() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {stack.map((item, index) => (
        <div key={item} className="flex items-center gap-2">
          <span className="rounded-xl border border-border-base px-3 py-2 text-xs uppercase tracking-[0.12em] text-text-secondary">{item}</span>
          {index < stack.length - 1 && <span className="text-text-muted">→</span>}
        </div>
      ))}
    </div>
  );
}

