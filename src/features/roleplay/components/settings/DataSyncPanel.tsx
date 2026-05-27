import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Check,
  Cloud,
  HardDrive,
  Info,
  RefreshCw,
  Search,
} from "lucide-react";
import { supabase } from "../../../auth/supabaseClient";
import {
  downloadCloudToLocal,
  getCloudSnapshot,
  getDiffSummary,
  getLocalSnapshot,
  getStoredSyncDecision,
  hasLocalData,
  storeSyncDecision,
  uploadLocalToCloud,
} from "../../services/localCloudSyncService";
import { getSyncMetadata } from "../../services/syncMetadata";
import type { SyncEntityType, SyncResult } from "../../types/sync";

const ENTITY_LABELS: Record<SyncEntityType, string> = {
  characters: "角色卡",
  prompt_templates: "提示词模板",
  worldbooks: "世界书",
  worldbook_entries: "世界书条目",
  memories: "记忆",
  sessions: "会话",
  branches: "分支",
  session_participants: "参与者",
  messages: "消息",
  message_revisions: "消息版本",
  context_runs: "上下文运行",
};

function ConfirmModal({
  title,
  message,
  detail,
  confirmLabel,
  onConfirm,
  onClose,
  busy,
}: {
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={busy ? undefined : onClose} />
      <div className="neo-panel relative mx-4 w-full max-w-sm rounded-[32px] p-5">
        <h3 className="mb-2 text-sm font-semibold text-ink-700">{title}</h3>
        <p className="text-xs leading-relaxed text-ink-500">{message}</p>
        {detail ? <p className="mt-2 text-xs text-ink-400">{detail}</p> : null}
        <div className="mt-4 flex gap-2">
          <button onClick={onConfirm} disabled={busy} className="btn-primary flex-1 text-xs disabled:opacity-50">
            {busy ? "处理中..." : confirmLabel}
          </button>
          <button onClick={onClose} disabled={busy} className="btn-ghost text-xs">取消</button>
        </div>
      </div>
    </div>
  );
}

interface DataSyncPanelProps {
  userId: string | null;
  isLoggedIn: boolean;
}

export function DataSyncPanel({ userId, isLoggedIn }: DataSyncPanelProps) {
  const canSync = isLoggedIn && !!supabase && !!userId;

  const [localCounts, setLocalCounts] = useState<Record<SyncEntityType, number> | null>(null);
  const [cloudCounts, setCloudCounts] = useState<Record<SyncEntityType, number> | null>(null);
  const [localHasData, setLocalHasData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>("");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);

  const lastMeta = userId ? getSyncMetadata(userId) : null;
  const storedDecision = userId ? getStoredSyncDecision(userId) : null;

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [local, hasData] = await Promise.all([
        getLocalSnapshot(),
        hasLocalData(),
      ]);
      setLocalCounts(local);
      setLocalHasData(hasData);

      if (canSync) {
        const cloud = await getCloudSnapshot(userId);
        setCloudCounts(cloud);
      } else {
        setCloudCounts(null);
      }
    } catch (e) {
      setError(`读取数据失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const handleDiff = useCallback(async () => {
    if (!canSync || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const summary = await getDiffSummary(userId);
      setLocalCounts(summary.localCounts);
      setCloudCounts(summary.cloudCounts);
      if (summary.missingInCloud.length > 0) {
        setError(`云端缺失：${summary.missingInCloud.map((e) => ENTITY_LABELS[e]).join("、")}`);
      } else if (summary.missingInLocal.length > 0) {
        setError(`本地缺失：${summary.missingInLocal.map((e) => ENTITY_LABELS[e]).join("、")}`);
      } else {
        setError(null);
      }
    } catch (e) {
      setError(`检测差异失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleUpload = useCallback(async () => {
    if (!canSync || !userId) return;
    setShowUploadConfirm(false);
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const result = await uploadLocalToCloud(userId, (entity, done, total) => {
        setSyncProgress(`上传 ${ENTITY_LABELS[entity]}... (${done}/${total})`);
      });
      setSyncResult(result);
      storeSyncDecision(userId, "upload");
      await refreshData();
    } catch (e) {
      setError(`上传失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSyncing(false);
      setSyncProgress("");
    }
  }, [refreshData, userId]);

  const handleDownload = useCallback(async () => {
    if (!canSync || !userId) return;
    setShowDownloadConfirm(false);
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const result = await downloadCloudToLocal(userId, (entity, done, total) => {
        setSyncProgress(`下载 ${ENTITY_LABELS[entity]}... (${done}/${total})`);
      });
      setSyncResult(result);
      storeSyncDecision(userId, "download");
      await refreshData();
    } catch (e) {
      setError(`下载失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSyncing(false);
      setSyncProgress("");
    }
  }, [refreshData, userId]);

  function totalCounts(counts: Record<SyncEntityType, number> | null): number {
    if (!counts) return 0;
    return Object.values(counts).reduce((sum, c) => sum + c, 0);
  }

  const localTotal = totalCounts(localCounts);
  const cloudTotal = totalCounts(cloudCounts);
  const isConsistent = localCounts && cloudCounts &&
    Object.keys(localCounts).every((k) => localCounts[k as SyncEntityType] === cloudCounts[k as SyncEntityType]);

  return (
    <div className="neo-panel space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Cloud className="h-5 w-5 text-brand-500" />
        <h3 className="text-sm font-semibold text-ink-700">数据同步中心</h3>
      </div>

      {/* Status overview */}
      <div className="grid gap-2 md:grid-cols-2">
        <div className="neo-panel-soft rounded-[24px] px-3 py-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-ink-400" />
            <p className="text-xs font-medium text-ink-500">本地数据</p>
          </div>
          <p className="mt-1 text-lg font-bold text-ink-700">
            {loading ? "..." : localTotal}
          </p>
          <p className="text-xs text-ink-400">
            {localHasData ? "当前浏览器有本地数据" : "暂无本地数据"}
          </p>
          {localCounts && localTotal > 0 ? (
            <div className="mt-2 text-[11px] text-ink-400">
              {Object.entries(localCounts)
                .filter(([, c]) => c > 0)
                .map(([k, c]) => `${ENTITY_LABELS[k as SyncEntityType]}: ${c}`)
                .join(" · ")}
            </div>
          ) : null}
        </div>

        <div className="neo-panel-soft rounded-[24px] px-3 py-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-ink-400" />
            <p className="text-xs font-medium text-ink-500">云端数据</p>
          </div>
          <p className="mt-1 text-lg font-bold text-ink-700">
            {!canSync || !userId ? "需要登录" : loading ? "..." : cloudTotal}
          </p>
          <p className="text-xs text-ink-400">
            {!canSync || !userId
              ? "登录后可查看云端数据"
              : `当前云端数据量`}
          </p>
          {cloudCounts && cloudTotal > 0 ? (
            <div className="mt-2 text-[11px] text-ink-400">
              {Object.entries(cloudCounts)
                .filter(([, c]) => c > 0)
                .map(([k, c]) => `${ENTITY_LABELS[k as SyncEntityType]}: ${c}`)
                .join(" · ")}
            </div>
          ) : null}
        </div>
      </div>

      {/* Sync status */}
      <div className="neo-panel-soft rounded-[24px] px-3 py-2.5">
        <div className="flex items-center gap-2">
          {isConsistent ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-xs text-ink-600">
            {!canSync || !userId
              ? "未登录，无法检测同步状态"
              : isConsistent
                ? "本地和云端数据一致"
                : "本地和云端数据不一致，可点击检测差异查看详情"}
          </span>
        </div>
        {lastMeta?.lastSyncedAt ? (
          <p className="mt-1 pl-6 text-xs text-ink-400">
            最后同步：{new Date(lastMeta.lastSyncedAt).toLocaleString()}
            {lastMeta.lastDirection === "local_to_cloud" ? " · 上次上传" : lastMeta.lastDirection === "cloud_to_local" ? " · 上次下载" : ""}
          </p>
        ) : null}
        {storedDecision === "skip" ? (
          <p className="mt-1 pl-6 text-xs text-ink-400">
            你选择了暂不同步，可随时在本页面手动操作。
          </p>
        ) : null}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => void handleDiff()}
          disabled={loading || !canSync || !userId}
          className="btn-ghost text-xs disabled:opacity-50"
        >
          <Search className="h-3.5 w-3.5" />
          检测差异
        </button>
        <button
          onClick={() => setShowUploadConfirm(true)}
          disabled={syncing || !canSync || !userId || !localHasData}
          className="btn-secondary text-xs disabled:opacity-50"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          上传到云端
        </button>
        <button
          onClick={() => setShowDownloadConfirm(true)}
          disabled={syncing || !canSync || !userId}
          className="btn-secondary text-xs disabled:opacity-50"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          下载到本地
        </button>
        <button
          onClick={() => void refreshData()}
          disabled={loading}
          className="btn-ghost text-xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {/* Progress */}
      {syncing ? (
        <div className="neo-panel-soft rounded-[24px] border border-brand-100 bg-brand-50/30 px-3 py-2">
          <p className="text-xs text-brand-700">
            <RefreshCw className="mr-1 inline h-3 w-3 animate-spin" />
            {syncProgress || "同步中..."}
          </p>
        </div>
      ) : null}

      {/* Result */}
      {syncResult ? (
        <div className={`rounded-[24px] border px-4 py-3 shadow-[0_12px_34px_rgba(148,163,184,0.10)] ${syncResult.failed > 0 || syncResult.conflicts > 0 ? "border-amber-100 bg-amber-light/20" : "border-emerald-100 bg-emerald-light/20"}`}>
          <h4 className="mb-2 text-sm font-medium text-ink-700">同步结果</h4>
          <div className="grid grid-cols-2 gap-1 text-xs md:grid-cols-4">
            <span className="text-ink-500">新增：{syncResult.created}</span>
            <span className="text-ink-500">跳过：{syncResult.skipped}</span>
            <span className="text-ink-500">重复：{syncResult.duplicated}</span>
            <span className="text-amber-600">冲突：{syncResult.conflicts}</span>
            <span className={syncResult.failed > 0 ? "text-rose-600" : "text-ink-400"}>
              失败：{syncResult.failed}
            </span>
          </div>
          {syncResult.details.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-ink-400">详情</summary>
              <ul className="mt-1 list-inside list-disc text-xs text-ink-400">
                {syncResult.details.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

      {/* Error */}
      {error ? (
        <div className="rounded-[24px] border border-rose-100 bg-rose-light/30 px-3 py-2 text-xs text-rose-600 shadow-[0_10px_30px_rgba(244,63,94,0.08)]">
          {error}
        </div>
      ) : null}

      {/* Safety notice */}
      <div className="neo-panel-soft rounded-[24px] px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-300" />
          <div className="text-xs leading-relaxed text-ink-400">
            <p>API Key、托管凭据密钥不会参与同步。同步只涉及角色、模板、世界书、记忆、会话和消息等业务数据。</p>
            <p className="mt-1">上传到云端的数据归属于当前登录账号。冲突时不会静默覆盖，优先保留双方数据。</p>
          </div>
        </div>
      </div>

      {/* Confirm modals */}
      {showUploadConfirm ? (
        <ConfirmModal
          title="上传本地数据到云端"
          message={`确定要将本地数据（约 ${localTotal} 条记录）上传到云端吗？`}
          detail="新数据会创建到云端，已存在的同 ID 数据不会覆盖。冲突时生成本地副本。"
          confirmLabel="确认上传"
          onConfirm={handleUpload}
          onClose={() => setShowUploadConfirm(false)}
          busy={syncing}
        />
      ) : null}

      {showDownloadConfirm ? (
        <ConfirmModal
          title="下载云端数据到本地"
          message={`确定要将云端数据（约 ${cloudTotal} 条记录）下载到本地吗？`}
          detail="本地没有的数据会写入。本地已有同 ID 数据不会覆盖。"
          confirmLabel="确认下载"
          onConfirm={handleDownload}
          onClose={() => setShowDownloadConfirm(false)}
          busy={syncing}
        />
      ) : null}
    </div>
  );
}
