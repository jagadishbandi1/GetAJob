import type { ReactNode } from "react";
import HoverGlow from "@/components/effects/HoverGlow";

// sample placeholder data — realistic-looking entries to swap with real content later.

const music = [
  { artist: "fred again..", album: "actual life 3", tint: "#6b8f6b" },
  { artist: "bon iver", album: "22, a million", tint: "#2d3a2e" },
  { artist: "frank ocean", album: "blonde", tint: "#8aad8c" },
  { artist: "tame impala", album: "currents", tint: "#3a4a3a" },
  { artist: "sza", album: "ctrl", tint: "#5a7a5a" },
];

const people = [
  { name: "rick rubin", why: "the case for doing less, better." },
  { name: "jony ive", why: "obsession with the details no one notices." },
  { name: "naval ravikant", why: "leverage over hours." },
  { name: "paul graham", why: "make something people want." },
];

const hobbies: { name: string; desc: string; icon: ReactNode }[] = [
  {
    name: "film photography",
    desc: "shooting 35mm, mostly portraits and city nights.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2l1.2-1.8A1 1 0 0 1 8.5 4.5h7a1 1 0 0 1 .8.7L17.5 7h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
    ),
  },
  {
    name: "bouldering",
    desc: "v4 projects on the wall most weeks.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M3 20h18M5 20l5-9 4 5 2-3 3 7" />
        <circle cx="9" cy="6" r="1.5" />
      </svg>
    ),
  },
  {
    name: "writing",
    desc: "short essays on building and taste.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M4 20l3.5-1L19 7.5a2 2 0 0 0-2.8-2.8L4.5 16.5z" />
        <path d="M14.5 6.5l3 3" />
      </svg>
    ),
  },
  {
    name: "running",
    desc: "slow mileage, early mornings.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <circle cx="14" cy="5" r="1.8" />
        <path d="M5 21l3-5 3 1 1 4M11 17l1-5 4 1 1-3" />
      </svg>
    ),
  },
];

const shows = [
  { title: "frieren", tint: "#5a7a5a" },
  { title: "severance", tint: "#2d3a2e" },
  { title: "vinland saga", tint: "#6b8f6b" },
  { title: "the bear", tint: "#3a4a3a" },
  { title: "cyberpunk: edgerunners", tint: "#8aad8c" },
  { title: "arcane", tint: "#47604a" },
];

const food: { name: string; icon: ReactNode }[] = [
  {
    name: "ramen tonkotsu",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M4 11h16a8 8 0 0 1-16 0z" />
        <path d="M8 7c0-1 .8-1.5.8-2.5M12 7c0-1 .8-1.5.8-2.5M16 7c0-1 .8-1.5.8-2.5" />
        <path d="M3 18h18" />
      </svg>
    ),
  },
  {
    name: "south indian dosa",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M3 17c4-6 14-6 18 0" />
        <circle cx="12" cy="11" r="1" />
      </svg>
    ),
  },
  {
    name: "wood-fired pizza",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M12 3 3 19h18z" />
        <circle cx="10" cy="13" r="1" />
        <circle cx="13" cy="16" r="1" />
      </svg>
    ),
  },
  {
    name: "thai green curry",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M4 12h16a8 8 0 0 1-16 0z" />
        <path d="M3 19h18" />
        <path d="M12 8V4" />
      </svg>
    ),
  },
  {
    name: "fresh pasta",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M5 5v14M9 5v14M13 5v14M17 5v14" />
      </svg>
    ),
  },
];

const quotes = [
  {
    text: "the details are not the details. they make the design.",
    by: "charles eames",
  },
  {
    text: "simplicity is the ultimate sophistication.",
    by: "leonardo da vinci",
  },
  {
    text: "you can't connect the dots looking forward; only backward.",
    by: "steve jobs",
  },
];

const facts = [
  "i can solve a rubik's cube in under a minute.",
  "i've watched the social network more than ten times.",
  "left-handed, but i use the mouse right-handed.",
  "i collect mechanical keyboards i never finish building.",
  "i drink my coffee black, always.",
  "i once read 40 books in a year.",
];

function CategoryHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
      {children}
    </h2>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toLowerCase();
}

export default function InterestsGrid() {
  return (
    <div className="flex flex-col gap-16">
      {/* 1. music — album-art square + artist + album */}
      <section>
        <CategoryHeader>music</CategoryHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {music.map((item) => (
            <HoverGlow key={item.artist} className="p-3">
              <div
                className="aspect-square w-full rounded-lg border border-border-base"
                style={{ background: item.tint }}
              />
              <p className="mt-3 truncate text-sm text-text-primary">{item.artist}</p>
              <p className="truncate text-xs text-text-secondary">{item.album}</p>
            </HoverGlow>
          ))}
        </div>
      </section>

      {/* 2. people who inspire me — initials avatar + name + why */}
      <section>
        <CategoryHeader>people who inspire me</CategoryHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {people.map((person) => (
            <HoverGlow key={person.name} className="flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-base bg-bg-elevated font-mono text-sm uppercase text-accent">
                {initials(person.name)}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-text-primary">{person.name}</p>
                <p className="text-xs leading-5 text-text-secondary">{person.why}</p>
              </div>
            </HoverGlow>
          ))}
        </div>
      </section>

      {/* 3. hobbies — icon + name + description */}
      <section>
        <CategoryHeader>hobbies</CategoryHeader>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hobbies.map((hobby) => (
            <HoverGlow key={hobby.name} className="p-5">
              <span className="text-accent">{hobby.icon}</span>
              <p className="mt-4 text-sm text-text-primary">{hobby.name}</p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">{hobby.desc}</p>
            </HoverGlow>
          ))}
        </div>
      </section>

      {/* 4. shows / anime — poster rectangle + title */}
      <section>
        <CategoryHeader>shows / anime</CategoryHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shows.map((show) => (
            <HoverGlow key={show.title} className="p-3">
              <div
                className="aspect-[2/3] w-full rounded-lg border border-border-base"
                style={{ background: show.tint }}
              />
              <p className="mt-3 truncate text-xs text-text-primary">{show.title}</p>
            </HoverGlow>
          ))}
        </div>
      </section>

      {/* 5. food / cooking — icon + dish/cuisine name */}
      <section>
        <CategoryHeader>food / cooking</CategoryHeader>
        <div className="flex flex-wrap gap-3">
          {food.map((dish) => (
            <HoverGlow key={dish.name} className="flex items-center gap-3 px-4 py-3">
              <span className="text-accent">{dish.icon}</span>
              <span className="text-sm text-text-primary">{dish.name}</span>
            </HoverGlow>
          ))}
        </div>
      </section>

      {/* 6. quotes — wider cards, serif italic quote + attribution */}
      <section>
        <CategoryHeader>quotes</CategoryHeader>
        <div className="grid gap-3 lg:grid-cols-3">
          {quotes.map((quote) => (
            <HoverGlow key={quote.by} className="p-6">
              <p className="font-serif text-xl italic leading-snug text-text-primary">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
                {quote.by}
              </p>
            </HoverGlow>
          ))}
        </div>
      </section>

      {/* 7. random facts — small pill/tag cards */}
      <section>
        <CategoryHeader>random facts</CategoryHeader>
        <div className="flex flex-wrap gap-2">
          {facts.map((fact) => (
            <span
              key={fact}
              className="rounded-full border border-border-base bg-bg-surface px-4 py-2 text-xs text-text-secondary transition-colors duration-200 hover:border-border-hover hover:text-text-primary"
            >
              {fact}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
