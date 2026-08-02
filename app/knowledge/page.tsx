"use client";

import { useEffect, useState } from "react";
import KnowledgePage from "@/components/knowledge/KnowledgePage";
import { useApp } from "@/components/AppProvider";

export default function Knowledge() {
  const {
    profile,
    setProfile,
    rules,
    documents,
    training,
    loadingTraining,
    savingProfile,
    profileSaved,
    resumeUploading,
    docUploading,
    gmailConnected,
    gmailSyncing,
    gmailSyncResult,
    saveProfile,
    uploadResume,
    uploadDocument,
    deleteDocument,
    addRule,
    deleteRule,
    deleteTraining,
    syncGmail,
  } = useApp();

  // Detect the read-only demo (Vercel) vs local run from the host. Set after
  // mount so server and first client render agree (no hydration mismatch).
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setIsDemo(!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname))
    );
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <KnowledgePage
      profile={profile}
      setProfile={setProfile}
      rules={rules}
      documents={documents}
      training={training}
      loadingTraining={loadingTraining}
      savingProfile={savingProfile}
      profileSaved={profileSaved}
      resumeUploading={resumeUploading}
      docUploading={docUploading}
      gmailConnected={gmailConnected}
      gmailSyncing={gmailSyncing}
      gmailSyncResult={gmailSyncResult}
      isDemo={isDemo}
      onSaveProfile={saveProfile}
      onUploadResume={uploadResume}
      onUploadDocument={uploadDocument}
      onDeleteDocument={deleteDocument}
      onAddRule={addRule}
      onDeleteRule={deleteRule}
      onDeleteTraining={deleteTraining}
      onSyncGmail={syncGmail}
    />
  );
}
