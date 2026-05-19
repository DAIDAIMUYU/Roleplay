import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsPreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { errorResponse, jsonResponse } from "../_shared/json.ts";
import { createKeyFingerprint, encryptApiKey } from "../_shared/crypto.ts";
import { clearDefaultCredential } from "../_shared/credentials.ts";
import { normalizeBaseUrl, validateProviderInput } from "../_shared/provider.ts";

serve(async (request) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "POST") {
    return errorResponse(request, 405, "Method not allowed.");
  }

  const auth = await requireUser(request);
  if (!auth.user) return auth.errorResponse;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return errorResponse(request, 400, "请求体不是有效 JSON。");
  }

  try {
    validateProviderInput({
      provider_type: typeof body.provider_type === "string" ? body.provider_type : undefined,
      base_url: typeof body.base_url === "string" ? body.base_url : null,
      default_model: typeof body.default_model === "string" ? body.default_model : null,
      api_key: typeof body.api_key === "string" ? body.api_key : "",
    });
  } catch (error) {
    return errorResponse(request, 400, error instanceof Error ? error.message : "托管凭据参数无效。");
  }

  const providerType = body.provider_type as "deepseek" | "openai_compatible";
  const baseUrl = normalizeBaseUrl(providerType, typeof body.base_url === "string" ? body.base_url : null);
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const defaultModel = (body.default_model as string).trim();
  const apiKey = (body.api_key as string).trim();
  const setDefault = body.set_default === true;
  const now = new Date().toISOString();

  try {
    if (setDefault) {
      await clearDefaultCredential(auth.serviceClient, auth.user.id);
    }

    const encrypted = await encryptApiKey(apiKey);
    const keyFingerprint = await createKeyFingerprint(apiKey);

    const { data: credential, error: credentialError } = await auth.serviceClient
      .from("provider_credentials")
      .insert({
        user_id: auth.user.id,
        label: label || null,
        provider_type: providerType,
        base_url: baseUrl || null,
        default_model: defaultModel,
        storage_mode: "hosted_encrypted",
        status: "active",
        is_default: setDefault,
        key_fingerprint: keyFingerprint,
        last_error: null,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (credentialError || !credential) {
      return errorResponse(request, 500, "保存托管凭据元数据失败。");
    }

    const { error: secretError } = await auth.serviceClient
      .from("provider_credential_secrets")
      .insert({
        credential_id: credential.id,
        user_id: auth.user.id,
        encrypted_api_key: encrypted.encrypted_api_key,
        encryption_iv: encrypted.encryption_iv,
        encryption_alg: encrypted.encryption_alg,
        encryption_key_version: encrypted.encryption_key_version,
        created_at: now,
        updated_at: now,
      });

    if (secretError) {
      await auth.serviceClient
        .from("provider_credentials")
        .delete()
        .eq("id", credential.id)
        .eq("user_id", auth.user.id);
      return errorResponse(request, 500, "保存托管凭据密文失败。");
    }

    return jsonResponse(request, {
      credential,
    });
  } catch {
    return errorResponse(request, 500, "托管凭据保存失败。");
  }
});
