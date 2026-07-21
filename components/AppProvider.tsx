"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useApplications } from "@/hooks/useApplications";
import { useDocuments } from "@/hooks/useDocuments";
import { useTraining } from "@/hooks/useTraining";
import { useHealth } from "@/hooks/useHealth";

type ProfileState = ReturnType<typeof useProfile>;
type ApplicationsState = ReturnType<typeof useApplications>;
type DocumentsState = ReturnType<typeof useDocuments>;
type TrainingState = ReturnType<typeof useTraining>;
type HealthState = ReturnType<typeof useHealth>;

interface AppContextValue
  extends ProfileState,
    ApplicationsState,
    DocumentsState,
    TrainingState,
    HealthState {
  // Apply flow + live polling
  jobUrl: string;
  setJobUrl: (value: string) => void;
  applying: boolean;
  appId: number | null;
  appLog: string;
  appStatus: string;
  profileWarning: boolean;
  // Gmail
  gmailSyncing: boolean;
  gmailSyncResult: string | null;
  handleApply: () => Promise<void>;
  syncGmail: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
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
        if (d.status === "done" || d.status === "failed" || d.status === "demo" || d.status === "review") {
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

  const value: AppContextValue = {
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
    documents,
    docUploading,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    training,
    loadingTraining,
    fetchTraining,
    deleteTraining,
    health,
    fetchHealth,
    jobUrl,
    setJobUrl,
    applying,
    appId,
    appLog,
    appStatus,
    profileWarning,
    gmailSyncing,
    gmailSyncResult,
    handleApply,
    syncGmail,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
