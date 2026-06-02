"use client";

import TrainingData from "@/components/home/TrainingData";
import { useApp } from "@/components/AppProvider";

export default function Training() {
  const { training, loadingTraining, deleteTraining } = useApp();

  return <TrainingData training={training} loading={loadingTraining} onDelete={deleteTraining} />;
}
