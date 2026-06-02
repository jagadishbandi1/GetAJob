"use client";

import { useCallback, useState } from "react";
import type { Health } from "./types";

export function useHealth() {
  const [health, setHealth] = useState<Health | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      setHealth(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  return { health, fetchHealth };
}
