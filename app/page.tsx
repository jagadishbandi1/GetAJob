"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import ApplicationTracker from "@/components/home/ApplicationTracker";
import TrainingData from "@/components/home/TrainingData";
import KnowledgePage from "@/components/knowledge/KnowledgePage";
import { useProfile } from "@/hooks/useProfile";
import { useApplications } from "@/hooks/useApplications";
import { useDocuments } from "@/hooks/useDocuments";
import { useTraining } from "@/hooks/useTraining";
import { useHealth } from "@/hooks/useHealth";
import type { Section } from "@/hooks/types";

export default function Home() {
  const [section, setSection] = useState<Section>("home");

  const {
    profile,
    setProfile,
    rules,
    savingProfile,
    profileSaved,
    resumeUploading,
    gmailConnected,
    setGmailConnected,
    fetchProfile,
    saveProfile,
    uploadResume,
    addRule,
    deleteRule,
  } = useProfile();

  const {
    applications,
    loadingApps,
    addingApp,
    setAddingApp,
    newApp,
    setNewApp,
    fetchApplications,
    deleteApplication,
    updateAppStatus,
    addManualApp,
  } = useApplications();

  const { documents, docUploading, fetchDocuments, uploadDocument, deleteDocument } = useDocuments();
  const { training, loadingTraining, fetchTraining, deleteTraining } = useTraining();

  // Apply flow + live polling
  const [jobUrl, setJobUrl] = useState("");
  const [applying, setApplying] = useState(false);
  const [appId, setAppId] = useState<number | null>(null);
  const [appLog, setAppLog] = useState("");
  const [appStatus, setAppStatus] = useState("");
  const [profileWarning, setProfileWarning] = useState(false);

  // System + Gmail
  const { health, fetchHealth } = useHealth();
  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [gmailSyncResult, setGmailSyncResult] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchApplications();
    fetchTraining();
    fetchDocuments();
    fetchHealth();

    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      setGmailConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchProfile, fetchApplications, fetchTraining, fetchDocuments, fetchHealth, setGmailConnected]);

  // Poll the running application until it finishes
  useEffect(() => {
    if (!appId) return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/applications?id=${appId}`);
      const d = await res.json();
      if (d) {
        setAppLog(d.log || "");
        setAppStatus(d.status || "");
        if (d.status === "done" || d.status === "failed") {
          clearInterval(iv);
          setApplying(false);
          fetchApplications();
        }
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [appId, fetchApplications]);

  const handleApply = useCallback(async () => {
    if (!jobUrl.trim()) return;
    if (!profile.full_name && !profile.resume_text) {
      setProfileWarning(true);
      return;
    }
    setProfileWarning(false);
    setApplying(true);
    setAppLog("");
    setAppStatus("running");
    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobUrl }),
    });
    const d = await res.json();
    setAppId(d.appId);
  }, [jobUrl, profile.full_name, profile.resume_text]);

  const syncGmail = useCallback(async () => {
    setGmailSyncing(true);
    setGmailSyncResult(null);
    try {
      const res = await fetch("/api/gmail", { method: "POST" });
      const d = await res.json();
      if (d.ok) {
        setGmailSyncResult(`synced ${d.synced} application${d.synced !== 1 ? "s" : ""} from ${d.total} emails`);
        fetchApplications();
      } else {
        setGmailSyncResult(d.error || "sync failed");
      }
    } catch {
      setGmailSyncResult("sync failed");
    }
    setGmailSyncing(false);
  }, [fetchApplications]);

  return (
    <>
      <Navbar section={section} onSectionChange={setSection} />

      {section === "home" && (
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
          onGoToKnowledge={() => setSection("knowledge")}
        />
      )}

      {section === "knowledge" && (
        <KnowledgePage
          profile={profile}
          setProfile={setProfile}
          rules={rules}
          documents={documents}
          savingProfile={savingProfile}
          profileSaved={profileSaved}
          resumeUploading={resumeUploading}
          docUploading={docUploading}
          onSaveProfile={saveProfile}
          onUploadResume={uploadResume}
          onUploadDocument={uploadDocument}
          onDeleteDocument={deleteDocument}
          onAddRule={addRule}
          onDeleteRule={deleteRule}
        />
      )}

      {section === "tracker" && (
        <ApplicationTracker
          applications={applications}
          loading={loadingApps}
          addingApp={addingApp}
          setAddingApp={setAddingApp}
          newApp={newApp}
          setNewApp={setNewApp}
          gmailConnected={gmailConnected}
          gmailSyncing={gmailSyncing}
          gmailSyncResult={gmailSyncResult}
          health={health}
          onSyncGmail={syncGmail}
          onAddManual={addManualApp}
          onDelete={deleteApplication}
          onUpdateStatus={updateAppStatus}
        />
      )}

      {section === "training" && (
        <TrainingData training={training} loading={loadingTraining} onDelete={deleteTraining} />
      )}
    </>
  );
}
