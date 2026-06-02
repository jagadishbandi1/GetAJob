"use client";

import ApplicationTracker from "@/components/home/ApplicationTracker";
import { useApp } from "@/components/AppProvider";

export default function Tracker() {
  const {
    applications,
    loadingApps,
    addingApp,
    setAddingApp,
    newApp,
    setNewApp,
    gmailConnected,
    gmailSyncing,
    gmailSyncResult,
    health,
    syncGmail,
    addManualApp,
    deleteApplication,
    updateAppStatus,
  } = useApp();

  return (
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
  );
}
