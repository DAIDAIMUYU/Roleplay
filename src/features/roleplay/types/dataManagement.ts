import type {
  BackupArtifactRow,
  BranchRow,
  CharacterRevisionRow,
  CharacterRow,
  ContextRunRow,
  MemoryRow,
  MessageRevisionRow,
  MessageRow,
  PromptTemplateRow,
  SessionParticipantRow,
  SessionRow,
  WorldbookEntryRow,
  WorldbookRow,
} from "./database";

export const BACKUP_SCHEMA_VERSION = "phase8.v1";
export const BACKUP_APP_NAME = "roleplay-tavern";

export type ImportMode = "copy" | "skip_existing";
export type TrashEntityType =
  | "all"
  | "sessions"
  | "messages"
  | "characters"
  | "prompt_templates"
  | "worldbooks"
  | "worldbook_entries"
  | "memories";

export interface BackupCounts {
  characters: number;
  character_revisions: number;
  prompt_templates: number;
  worldbooks: number;
  worldbook_entries: number;
  memories: number;
  sessions: number;
  branches: number;
  session_participants: number;
  messages: number;
  message_revisions: number;
  context_runs: number;
}

export interface BackupPayloadData {
  characters: CharacterRow[];
  character_revisions: CharacterRevisionRow[];
  prompt_templates: PromptTemplateRow[];
  worldbooks: WorldbookRow[];
  worldbook_entries: WorldbookEntryRow[];
  memories: MemoryRow[];
  sessions: SessionRow[];
  branches: BranchRow[];
  session_participants: SessionParticipantRow[];
  messages: MessageRow[];
  message_revisions: MessageRevisionRow[];
  context_runs: ContextRunRow[];
}

export interface RoleplayBackupFile {
  schema_version: string;
  app_name: string;
  exported_at: string;
  export_type: "full_user_backup";
  counts: BackupCounts;
  data: BackupPayloadData;
}

export interface DataManagementStats {
  exportCounts: BackupCounts;
  deletedCounts: Record<Exclude<TrashEntityType, "all">, number>;
  backupArtifacts: BackupArtifactRow[];
}

export interface ImportPreview {
  fileName: string;
  schemaVersion: string;
  appName: string;
  counts: BackupCounts;
  includesContextRuns: boolean;
  payload: RoleplayBackupFile;
}

export interface ImportResult {
  imported: BackupCounts;
  skipped: BackupCounts;
  includesContextRuns: boolean;
}

export interface TrashListItem {
  entityType: Exclude<TrashEntityType, "all">;
  entityId: string;
  title: string;
  deletedAt: string;
  description: string;
}
