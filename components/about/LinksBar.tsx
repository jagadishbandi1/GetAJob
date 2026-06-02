const links = [
  ["github", "#"],
  ["linkedin", "#"],
  ["portfolio", "#"],
  ["email", "mailto:jagadishbandi1@gmail.com"],
];

export default function LinksBar() {
  return (
    <div className="flex flex-wrap gap-3">
      {links.map(([label, href]) => (
        <a key={label} href={href} className="rounded-xl border border-border-base px-4 py-2 text-sm text-accent">
          {label}
        </a>
      ))}
    </div>
  );
}

