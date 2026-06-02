"use client";

import { useCallback, useState } from "react";
import type { TrainingExample } from "./types";

export function useTraining() {
  const [training, setTraining] = useState<TrainingExample[]>([]);
  const [loadingTraining, setLoadingTraining] = useState(true);

  const fetchTraining = useCallback(async () => {
    setLoadingTraining(true);
    const res = await fetch("/api/training");
    setTraining((await res.json()) || []);
    setLoadingTraining(false);
  }, []);

  const deleteTraining = useCallback(async (id?: number) => {
    await fetch(id ? `/api/training?id=${id}` : "/api/training", { method: "DELETE" });
    await fetchTraining();
  }, [fetchTraining]);

  return { training, loadingTraining, fetchTraining, deleteTraining };
}

