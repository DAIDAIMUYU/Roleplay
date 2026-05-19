/**
 * localStorageMetadata — 本地数据保护状态和备份元数据。
 */

const BACKUP_META_KEY = "rp_tavern_last_backup";
const STORAGE_PERSIST_GRANTED_KEY = "rp_tavern_storage_persist_granted";

export interface BackupRecord {
  lastBackupAt: string;
  entityCount: number;
}

export interface StorageProtectionStatus {
  /** IndexedDB 可用 */
  indexedDbAvailable: boolean;
  /** 浏览器已授予持久化存储 */
  persistenceGranted: boolean | null;
  /** 持久化存储 API 是否可用 */
  persistenceApiSupported: boolean;
  /** 上次备份时间 */
  lastBackupAt: string | null;
  /** 上次备份数据量 */
  lastBackupEntityCount: number | null;
}

export function recordBackup(entityCount: number): void {
  try {
    const record: BackupRecord = {
      lastBackupAt: new Date().toISOString(),
      entityCount,
    };
    localStorage.setItem(BACKUP_META_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

export function getLastBackup(): BackupRecord | null {
  try {
    const raw = localStorage.getItem(BACKUP_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BackupRecord;
  } catch {
    return null;
  }
}

export async function checkStoragePersistence(): Promise<{
  persisted: boolean | null;
  apiSupported: boolean;
}> {
  if (!("storage" in navigator)) {
    return { persisted: null, apiSupported: false };
  }
  try {
    const persisted = await navigator.storage.persisted();
    return { persisted, apiSupported: true };
  } catch {
    return { persisted: null, apiSupported: false };
  }
}

export async function requestStoragePersistence(): Promise<boolean> {
  if (!("storage" in navigator) || !navigator.storage.persist) {
    return false;
  }
  try {
    const granted = await navigator.storage.persist();
    if (granted) {
      localStorage.setItem(STORAGE_PERSIST_GRANTED_KEY, "true");
    }
    return granted;
  } catch {
    return false;
  }
}

export function getStorageProtectionStatus(): StorageProtectionStatus {
  const backup = getLastBackup();
  // Check if IndexedDB is available
  const indexedDbAvailable = "indexedDB" in window;
  // Check if persistence was previously granted
  const wasGranted = localStorage.getItem(STORAGE_PERSIST_GRANTED_KEY) === "true";

  return {
    indexedDbAvailable,
    persistenceGranted: wasGranted || null,
    persistenceApiSupported: "storage" in navigator,
    lastBackupAt: backup?.lastBackupAt ?? null,
    lastBackupEntityCount: backup?.entityCount ?? null,
  };
}
