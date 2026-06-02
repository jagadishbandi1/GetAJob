"use client";

import ScrollReveal from "@/components/effects/ScrollReveal";
import PhotoSection from "./PhotoSection";
import Manifesto from "./Manifesto";
import InterestsGrid from "./InterestsGrid";
import TechStack from "./TechStack";
import LinksBar from "./LinksBar";

export default function AboutView() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <div className="flex flex-col gap-20">
        <ScrollReveal>
          <PhotoSection />
        </ScrollReveal>
        <ScrollReveal>
          <Manifesto />
        </ScrollReveal>
        <ScrollReveal>
          <InterestsGrid />
        </ScrollReveal>
        <ScrollReveal>
          <TechStack />
        </ScrollReveal>
        <ScrollReveal>
          <LinksBar />
        </ScrollReveal>
      </div>
    </main>
  );
}
