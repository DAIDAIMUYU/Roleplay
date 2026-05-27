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

  const credentialId = typeof body.credential_id === "string" ? body.credential_id.trim() : "";
  const providerType = body.provider_type as "deepseek" | "openai_compatible";
  const baseUrl = normalizeBaseUrl(providerType, typeof body.base_url === "string" ? body.base_url : null);
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const defaultModel = typeof body.default_model === "string" ? body.default_model.trim() : "";
  const apiKey = typeof body.api_key === "string" ? body.api_key.trim() : "";
  const setDefault = body.set_default === true;
  const now = new Date().toISOString();

  try {
    validateProviderInput({
      provider_type: providerType,
      base_url: baseUrl,
      default_model: defaultModel,
      ...(apiKey ? { api_key: apiKey } : {}),
    });
  } catch (error) {
    return errorResponse(request, 400, error instanceof Error ? error.message : "托管凭据参数无效。");
  }

  try {
    if (setDefault) {
      await clearDefaultCredential(auth.serviceClient, auth.user.id);
    }

    if (credentialId) {
      const { data: existing, error: existingError } = await auth.serviceClient
        .from("provider_credentials")
        .select("*")
        .eq("id", credentialId)
        .eq("user_id", auth.user.id)
        .is("deleted_at", null)
        .neq("status", "deleted")
        .maybeSingle();

      if (existingError || !existing) {
        return errorResponse(request, 404, "未找到可编辑的托管凭据。");
      }

      const updatePayload: Record<string, unknown> = {
        label: label || null,
        provider_type: providerType,
        base_url: baseUrl || null,
        default_model: defaultModel,
        status: "active",
        is_default: setDefault,
        last_error: null,
        updated_at: now,
      };

      if (apiKey) {
        updatePayload.key_fingerprint = await createKeyFingerprint(apiKey);
      }

      const { data: updatedCredential, error: updateError } = await auth.serviceClient
        .from("provider_credentials")
        .update(updatePayload)
        .eq("id", credentialId)
        .eq("user_id", auth.user.id)
        .select("*")
        .single();

      if (updateError || !updatedCredential) {
        return errorResponse(request, 500, "更新托管凭据元数据失败。");
      }

      if (apiKey) {
        const encrypted = await encryptApiKey(apiKey);
        const { data: existingSecret } = await auth.serviceClient
          .from("provider_credential_secrets")
          .select("id")
          .eq("credential_id", credentialId)
          .eq("user_id", auth.user.id)
          .is("deleted_at", null)
          .maybeSingle();

        if (existingSecret?.id) {
          const { error: secretUpdateError } = await auth.serviceClient
            .from("provider_credential_secrets")
            .update({
              encrypted_api_key: encrypted.encrypted_api_key,
              encryption_iv: encrypted.encryption_iv,
              encryption_alg: encrypted.encryption_alg,
              encryption_key_version: encrypted.encryption_key_version,
              updated_at: now,
            })
            .eq("id", existingSecret.id)
            .eq("user_id", auth.user.id);

          if (secretUpdateError) {
            return errorResponse(request, 500, "更新托管凭据密文失败。");
          }
        } else {
          const { error: secretInsertError } = await auth.serviceClient
            .from("provider_credential_secrets")
            .insert({
              credential_id: credentialId,
              user_id: auth.user.id,
              encrypted_api_key: encrypted.encrypted_api_key,
              encryption_iv: encrypted.encryption_iv,
              encryption_alg: encrypted.encryption_alg,
              encryption_key_version: encrypted.encryption_key_version,
              created_at: now,
              updated_at: now,
            });

          if (secretInsertError) {
            return errorResponse(request, 500, "更新托管凭据密文失败。");
          }
        }
      }

      return jsonResponse(request, {
        credential: updatedCredential,
      });
    }

    if (!apiKey) {
      return errorResponse(request, 400, "请输入 API Key。");
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
