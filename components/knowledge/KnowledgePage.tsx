"use client";

import HoverGlow from "@/components/effects/HoverGlow";
import ScrollReveal from "@/components/effects/ScrollReveal";
import SectionHeader from "@/components/layout/SectionHeader";
import Skeleton from "@/components/layout/Skeleton";
import type { Document, Profile, Rule, TrainingExample } from "@/hooks/types";
import AnswerRules from "./AnswerRules";
import DocumentsList from "./DocumentsList";
import GmailSection from "./GmailSection";
import ProfileCard from "./ProfileCard";
import ResumeParser from "./ResumeParser";

export default function KnowledgePage({
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
  isDemo,
  onSaveProfile,
  onUploadResume,
  onUploadDocument,
  onDeleteDocument,
  onAddRule,
  onDeleteRule,
  onDeleteTraining,
  onSyncGmail,
}: {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  rules: Rule[];
  documents: Document[];
  training: TrainingExample[];
  loadingTraining: boolean;
  savingProfile: boolean;
  profileSaved: boolean;
  resumeUploading: boolean;
  docUploading: boolean;
  gmailConnected: boolean;
  gmailSyncing: boolean;
  gmailSyncResult: string | null;
  isDemo: boolean;
  onSaveProfile: () => void;
  onUploadResume: (file: File) => Promise<void> | void;
  onUploadDocument: (file: File) => void;
  onDeleteDocument: (id: number) => void;
  onAddRule: (rule: { trigger_keyword: string; response: string }) => void;
  onDeleteRule: (id: number) => void;
  onDeleteTraining: (id?: number) => void;
  onSyncGmail: () => void;
}) {
  return (
    <section className="relative z-10 mx-auto max-w-4xl px-5 pb-24 pt-32">
      <SectionHeader
        eyebrow="knowledge"
        title="everything claude knows about you."
        sub="resume, documents, context, and custom rules. the more you give it, the better it fills."
      />
      <div className="space-y-4">
        <ScrollReveal>
          <ResumeParser
            profile={profile}
            setProfile={setProfile}
            uploading={resumeUploading}
            onUpload={onUploadResume}
            onSaveProfile={onSaveProfile}
            saving={savingProfile}
            saved={profileSaved}
          />
        </ScrollReveal>
        <ScrollReveal delay={80}>
          <ProfileCard profile={profile} setProfile={setProfile} saving={savingProfile} saved={profileSaved} onSave={onSaveProfile} />
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <DocumentsList documents={documents} uploading={docUploading} onUpload={onUploadDocument} onDelete={onDeleteDocument} />
        </ScrollReveal>
        <ScrollReveal delay={160}>
          <AnswerRules rules={rules} onAdd={onAddRule} onDelete={onDeleteRule} />
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <GmailSection
            connected={gmailConnected}
            syncing={gmailSyncing}
            syncResult={gmailSyncResult}
            isDemo={isDemo}
            onSync={onSyncGmail}
          />
        </ScrollReveal>
      </div>

      <div className="mt-20">
        <SectionHeader
          eyebrow="memory"
          title="training data"
          sub={`${training.length} answer${training.length === 1 ? "" : "s"} remembered.`}
        />
        {training.length > 0 && (
          <div className="mb-6 text-center">
            <button type="button" onClick={() => onDeleteTraining()} className="text-xs text-[var(--red)]">
              clear all training data
            </button>
          </div>
        )}
        {loadingTraining ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <HoverGlow key={item} className="p-4">
                <Skeleton className="mb-3 h-3 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </HoverGlow>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {training.length === 0 && (
              <p className="py-16 text-center text-sm text-text-secondary">no training data yet.</p>
            )}
            {training.map((example) => (
              <ScrollReveal key={example.id}>
                <HoverGlow className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-text-muted">{example.question_text}</p>
                      <p className="mt-2 text-sm text-text-primary">{example.answer_given}</p>
                      {example.job_url && (
                        <p className="mt-2 truncate text-xs text-text-muted">{example.job_url}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteTraining(example.id)}
                      className="shrink-0 text-sm text-text-muted"
                    >
                      remove
                    </button>
                  </div>
                </HoverGlow>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
