"use client";

import { useCallback, useState } from "react";
import type { Application } from "./types";

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [addingApp, setAddingApp] = useState(false);
  const [newApp, setNewApp] = useState({
    job_url: "",
    company: "",
    job_title: "",
    location: "",
    compensation: "",
    status: "done",
  });

  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    const res = await fetch("/api/applications");
    setApplications((await res.json()) || []);
    setLoadingApps(false);
  }, []);

  const deleteApplication = useCallback(async (id: number) => {
    await fetch(`/api/applications?id=${id}`, { method: "DELETE" });
    await fetchApplications();
  }, [fetchApplications]);

  const updateAppStatus = useCallback(async (id: number, status: string) => {
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setApplications((prev) => prev.map((app) => app.id === id ? { ...app, status } : app));
  }, []);

  const addManualApp = useCallback(async () => {
    if (!newApp.job_url) return;
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newApp),
    });
    setNewApp({ job_url: "", company: "", job_title: "", location: "", compensation: "", status: "done" });
    setAddingApp(false);
    await fetchApplications();
  }, [fetchApplications, newApp]);

  return {
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
  };
}

