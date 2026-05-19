import type { SyncMetadata, SyncDecision } from "../types/sync";

const SYNC_DECISION_PREFIX = "rp_sync_decision_";
const SYNC_METADATA_PREFIX = "rp_sync_meta_";

export function getSyncDecision(userId: string): SyncDecision | null {
  const raw = localStorage.getItem(`${SYNC_DECISION_PREFIX}${userId}`);
  if (raw === "upload" || raw === "download" || raw === "skip") return raw;
  return null;
}

export function setSyncDecision(userId: string, decision: SyncDecision): void {
  localStorage.setItem(`${SYNC_DECISION_PREFIX}${userId}`, decision);
}

export function clearSyncDecision(userId: string): void {
  localStorage.removeItem(`${SYNC_DECISION_PREFIX}${userId}`);
}

export function getSyncMetadata(userId: string): SyncMetadata | null {
  const raw = localStorage.getItem(`${SYNC_METADATA_PREFIX}${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SyncMetadata;
  } catch {
    return null;
  }
}

export function setSyncMetadata(userId: string, meta: SyncMetadata): void {
  localStorage.setItem(`${SYNC_METADATA_PREFIX}${userId}`, JSON.stringify(meta));
}

export function clearSyncMetadata(userId: string): void {
  localStorage.removeItem(`${SYNC_METADATA_PREFIX}${userId}`);
}
