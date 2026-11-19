import type { Revision, TipTapDocument } from "../types/article";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed") as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return data as T;
}

export const api = {
  getArticle: () => request<{ currentRevision: Revision; lastEditor: string; lastUpdated: string; version: number }>("/api/article"),
  getRevisions: () => request<{ revisions: Revision[] }>("/api/article/revisions"),
  getRevision: (id: number) => request<{ revision: Revision }>(`/api/article/revisions/${id}`),
  saveRevision: (editorName: string, content: TipTapDocument, expectedCurrentVersion: number) =>
    request<{ revision: Revision }>("/api/article/revisions", { method: "POST", body: JSON.stringify({ editorName, content, expectedCurrentVersion }) }),
  unlockAdmin: (accessCode: string) => request<{ authenticated: boolean }>("/api/admin/unlock", { method: "POST", body: JSON.stringify({ accessCode }) }),
  adminSession: () => request<{ authenticated: boolean }>("/api/admin/session"),
  logoutAdmin: () => request<{ authenticated: boolean }>("/api/admin/logout", { method: "POST" }),
  restoreRevision: (id: number) => request<{ revision: Revision }>(`/api/admin/revisions/${id}/restore`, { method: "POST" }),
  restoreDefault: () => request<{ revision: Revision }>("/api/admin/restore-default", { method: "POST" })
};
