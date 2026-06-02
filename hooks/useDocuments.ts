"use client";

import { useCallback, useState } from "react";
import type { Document } from "./types";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docUploading, setDocUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    setDocuments((await res.json()) || []);
  }, []);

  const uploadDocument = useCallback(async (file: File) => {
    setDocUploading(true);
    const formData = new FormData();
    formData.append("type", "document");
    formData.append("file", file);
    await fetch("/api/upload", { method: "POST", body: formData });
    setDocUploading(false);
    await fetchDocuments();
  }, [fetchDocuments]);

  const deleteDocument = useCallback(async (id: number) => {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    await fetchDocuments();
  }, [fetchDocuments]);

  return { documents, docUploading, fetchDocuments, uploadDocument, deleteDocument };
}

