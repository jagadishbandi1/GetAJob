"use client";

import KnowledgePage from "@/components/knowledge/KnowledgePage";
import { useApp } from "@/components/AppProvider";

export default function Knowledge() {
  const {
    profile,
    setProfile,
    rules,
    documents,
    savingProfile,
    profileSaved,
    resumeUploading,
    docUploading,
    saveProfile,
    uploadResume,
    uploadDocument,
    deleteDocument,
    addRule,
    deleteRule,
  } = useApp();

  return (
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
  );
}
