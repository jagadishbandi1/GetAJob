"use client";

import { useCallback, useState } from "react";
import { defaultProfile, type Profile, type Rule } from "./types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [rules, setRules] = useState<Rule[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (data.profile) {
      setProfile({ ...defaultProfile, ...data.profile });
      setGmailConnected(!!data.profile.gmail_connected);
    }
    setRules(data.rules || []);
  }, []);

  const saveProfile = useCallback(async () => {
    setSavingProfile(true);
    setProfileSaved(false);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "profile", ...profile }),
    });
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }, [profile]);

  const uploadResume = useCallback(async (file: File) => {
    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append("type", "resume");
      formData.append("file", file);
      await fetch("/api/upload", { method: "POST", body: formData });
      await fetchProfile();
    } finally {
      setResumeUploading(false);
    }
  }, [fetchProfile]);

  const addRule = useCallback(async (rule: { trigger_keyword: string; response: string }) => {
    if (!rule.trigger_keyword || !rule.response) return;
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "rule", ...rule }),
    });
    await fetchProfile();
  }, [fetchProfile]);

  const deleteRule = useCallback(async (id: number) => {
    await fetch(`/api/profile?type=rule&id=${id}`, { method: "DELETE" });
    await fetchProfile();
  }, [fetchProfile]);

  return {
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
  };
}

