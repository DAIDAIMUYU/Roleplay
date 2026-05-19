export type SyncEntityType =
  | "characters"
  | "prompt_templates"
  | "worldbooks"
  | "worldbook_entries"
  | "memories"
  | "sessions"
  | "branches"
  | "session_participants"
  | "messages"
  | "message_revisions"
  | "context_runs";

export const SYNC_UPLOAD_ORDER: SyncEntityType[] = [
  "characters",
  "prompt_templates",
  "worldbooks",
  "worldbook_entries",
  "memories",
  "sessions",
  "branches",
  "session_participants",
  "messages",
  "message_revisions",
  "context_runs",
];

export const SYNC_DOWNLOAD_ORDER: SyncEntityType[] = [
  "characters",
  "prompt_templates",
  "worldbooks",
  "worldbook_entries",
  "memories",
  "sessions",
  "branches",
  "session_participants",
  "messages",
  "message_revisions",
  "context_runs",
];

export type SyncDirection = "local_to_cloud" | "cloud_to_local";

export interface SyncConflict {
  entityType: SyncEntityType;
  localId: string;
  cloudId: string | null;
  reason: "both_modified" | "cloud_only" | "local_only" | "id_conflict";
  localUpdatedAt?: string;
  cloudUpdatedAt?: string;
  resolution?: "skip" | "copy_local_as_new" | "copy_cloud_as_new";
  resolvedNewId?: string;
}

export interface LocalDataSnapshot {
  entityType: SyncEntityType;
  count: number;
}

export interface CloudDataSnapshot {
  entityType: SyncEntityType;
  count: number;
}

export interface SyncSummary {
  localCounts: Record<SyncEntityType, number>;
  cloudCounts: Record<SyncEntityType, number>;
  missingInCloud: SyncEntityType[];
  missingInLocal: SyncEntityType[];
  conflicts: SyncConflict[];
  lastSyncedAt: string | null;
}

export interface SyncResult {
  created: number;
  skipped: number;
  duplicated: number;
  conflicts: number;
  failed: number;
  details: string[];
}

export interface SyncMetadata {
  userId: string;
  lastSyncedAt: string | null;
  lastDirection: SyncDirection | null;
  lastDecision: "upload" | "download" | "skip" | null;
  lastLocalCounts: Partial<Record<SyncEntityType, number>>;
  lastCloudCounts: Partial<Record<SyncEntityType, number>>;
  lastConflictCount: number;
  updatedAt: string | null;
}

export type SyncDecision = "upload" | "download" | "skip";
