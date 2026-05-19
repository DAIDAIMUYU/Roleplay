import { supabase } from "../../auth/supabaseClient";
import type { AppProblem, ChatMessage, ChatResult, ProviderType, TestResult } from "../providers";
import { translateError } from "../providers";
import type { ProviderCredentialRow } from "../types/database";

const SELECTION_STORAGE_KEY = "rp_tavern_hosted_credential_selection";

export interface HostedCredentialSelection {
  credentialId: string;
  provider: ProviderType;
  model: string;
  baseURL: string;
  label: string;
  storageMode: "hosted_encrypted";
  updatedAt: string;
}

export interface HostedCredentialSaveInput {
  label: string;
  provider_type: Exclude<ProviderType, "mock">;
  base_url: string;
  default_model: string;
  api_key: string;
  set_default?: boolean;
}

export interface HostedProviderChatInput {
  credential_id: string;
  provider_type: Exclude<ProviderType, "mock">;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error("Supabase 未配置。");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("当前未登录，无法使用托管 API 凭据。");
  return token;
}

async function callFunction<T>(
  functionName: string,
  options?: {
    method?: "GET" | "POST";
    body?: unknown;
  },
): Promise<T> {
  if (!supabase) throw new Error("Supabase 未配置。");
  const token = await getAccessToken();
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: options?.method ?? "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options?.method === "GET" ? undefined : JSON.stringify(options?.body ?? {}),
  });

  const text = await response.text().catch(() => "");
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { detail: text };
  }

  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload && "detail" in payload
        ? String((payload as Record<string, unknown>).detail)
        : text || `HTTP ${response.status}`;
    throw translateError({ status: response.status, message: detail }, "hosted_encrypted");
  }

  return payload as T;
}

function toSelection(credential: ProviderCredentialRow): HostedCredentialSelection {
  return {
    credentialId: credential.id,
    provider: credential.provider_type,
    model: credential.default_model || "",
    baseURL: credential.base_url || "",
    label: credential.label || "托管凭据",
    storageMode: "hosted_encrypted",
    updatedAt: credential.updated_at,
  };
}

export function loadHostedCredentialSelection(): HostedCredentialSelection | null {
  try {
    const raw = localStorage.getItem(SELECTION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HostedCredentialSelection;
  } catch {
    return null;
  }
}

export function saveHostedCredentialSelection(selection: HostedCredentialSelection): void {
  try {
    localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selection));
  } catch {
    // ignore storage failures
  }
}

export function clearHostedCredentialSelection(credentialId?: string): void {
  try {
    const current = loadHostedCredentialSelection();
    if (credentialId && current?.credentialId !== credentialId) return;
    localStorage.removeItem(SELECTION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function listHostedCredentials(): Promise<ProviderCredentialRow[]> {
  const payload = await callFunction<{ credentials: ProviderCredentialRow[] }>("hosted-credentials-list", {
    method: "GET",
  });
  return payload.credentials ?? [];
}

export async function getDefaultHostedCredential(): Promise<ProviderCredentialRow | null> {
  const credentials = await listHostedCredentials();
  return credentials.find((credential) => credential.status === "active" && credential.is_default && !credential.deleted_at) ?? null;
}

export async function saveHostedCredential(input: HostedCredentialSaveInput): Promise<ProviderCredentialRow> {
  const payload = await callFunction<{ credential: ProviderCredentialRow }>("hosted-credentials-save", {
    method: "POST",
    body: input,
  });
  const credential = payload.credential;
  if (credential) saveHostedCredentialSelection(toSelection(credential));
  return credential;
}

export async function setDefaultHostedCredential(credentialId: string): Promise<ProviderCredentialRow> {
  const payload = await callFunction<{ credential: ProviderCredentialRow }>("hosted-credentials-set-default", {
    method: "POST",
    body: { credential_id: credentialId },
  });
  const credential = payload.credential;
  if (credential) saveHostedCredentialSelection(toSelection(credential));
  return credential;
}

export async function testHostedCredential(credentialId: string): Promise<TestResult> {
  try {
    const payload = await callFunction<{ ok: boolean; latencyMs?: number; models?: string[]; detail?: string }>(
      "hosted-credentials-test",
      {
        method: "POST",
        body: { credential_id: credentialId },
      },
    );
    return {
      ok: payload.ok,
      latencyMs: payload.latencyMs,
      models: payload.models,
    };
  } catch (error) {
    return {
      ok: false,
      error: error as AppProblem,
    };
  }
}

export async function deleteHostedCredential(credentialId: string): Promise<void> {
  await callFunction("hosted-credentials-delete", {
    method: "POST",
    body: { credential_id: credentialId },
  });
  clearHostedCredentialSelection(credentialId);
}

export async function sendHostedProviderChat(input: HostedProviderChatInput): Promise<ChatResult> {
  const payload = await callFunction<ChatResult>("hosted-provider-chat", {
    method: "POST",
    body: input,
  });
  return payload;
}

export function selectionFromCredential(credential: ProviderCredentialRow): HostedCredentialSelection {
  return toSelection(credential);
}
