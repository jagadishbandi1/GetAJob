"use client";

import { useRouter } from "next/navigation";
import HeroSection from "@/components/home/HeroSection";
import { useApp } from "@/components/AppProvider";

export default function Home() {
  const router = useRouter();
  const {
    jobUrl,
    setJobUrl,
    applying,
    appStatus,
    appLog,
    profileWarning,
    health,
    gmailConnected,
    applications,
    documents,
    training,
    handleApply,
  } = useApp();

  return (
    <HeroSection
      jobUrl={jobUrl}
      setJobUrl={setJobUrl}
      applying={applying}
      appStatus={appStatus}
      appLog={appLog}
      profileWarning={profileWarning}
      health={health}
      gmailConnected={gmailConnected}
      stats={{ applications: applications.length, documents: documents.length, training: training.length }}
      onApply={handleApply}
      onGoToKnowledge={() => router.push("/knowledge")}
    />
  );
}
