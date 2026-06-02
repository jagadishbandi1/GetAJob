import HoverGlow from "@/components/effects/HoverGlow";

const interests = ["music", "inspirations", "people i look up to", "hobbies", "tools i use"];

export default function InterestsGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {interests.map((interest) => (
        <HoverGlow key={interest} className="p-5">
          <p className="text-sm text-text-primary">{interest}</p>
          <p className="mt-2 text-xs leading-5 text-text-secondary">placeholder for jagdish to fill in.</p>
        </HoverGlow>
      ))}
    </div>
  );
}

