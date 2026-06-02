"use client";

import ScrollReveal from "@/components/effects/ScrollReveal";
import SectionHeader from "@/components/layout/SectionHeader";
import type { Document, Profile, Rule } from "@/hooks/types";
import AnswerRules from "./AnswerRules";
import DocumentsList from "./DocumentsList";
import ProfileCard from "./ProfileCard";
import ResumeParser from "./ResumeParser";

export default function KnowledgePage({
  profile,
  setProfile,
  rules,
  documents,
  savingProfile,
  profileSaved,
  resumeUploading,
  docUploading,
  onSaveProfile,
  onUploadResume,
  onUploadDocument,
  onDeleteDocument,
  onAddRule,
  onDeleteRule,
}: {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  rules: Rule[];
  documents: Document[];
  savingProfile: boolean;
  profileSaved: boolean;
  resumeUploading: boolean;
  docUploading: boolean;
  onSaveProfile: () => void;
  onUploadResume: (file: File) => void;
  onUploadDocument: (file: File) => void;
  onDeleteDocument: (id: number) => void;
  onAddRule: (rule: { trigger_keyword: string; response: string }) => void;
  onDeleteRule: (id: number) => void;
}) {
  return (
    <section className="relative z-10 mx-auto max-w-4xl px-5 pb-24 pt-32">
      <SectionHeader
        eyebrow="knowledge"
        title="everything claude knows about you."
        sub="resume, documents, context, and custom rules. the more you give it, the better it fills."
      />
      <div className="space-y-4">
        <ScrollReveal><ResumeParser profile={profile} uploading={resumeUploading} onUpload={onUploadResume} /></ScrollReveal>
        <ScrollReveal delay={80}>
          <ProfileCard profile={profile} setProfile={setProfile} saving={savingProfile} saved={profileSaved} onSave={onSaveProfile} />
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <DocumentsList documents={documents} uploading={docUploading} onUpload={onUploadDocument} onDelete={onDeleteDocument} />
        </ScrollReveal>
        <ScrollReveal delay={160}>
          <AnswerRules rules={rules} onAdd={onAddRule} onDelete={onDeleteRule} />
        </ScrollReveal>
      </div>
    </section>
  );
}

