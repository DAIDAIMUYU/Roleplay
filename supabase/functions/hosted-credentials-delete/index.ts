import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsPreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { chooseFallbackDefaultCredential, getCredentialForUser } from "../_shared/credentials.ts";
import { errorResponse, jsonResponse } from "../_shared/json.ts";

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

  const credentialId = typeof body.credential_id === "string" ? body.credential_id : "";
  if (!credentialId) {
    return errorResponse(request, 400, "缺少 credential_id。");
  }

  try {
    const { credential } = await getCredentialForUser(auth.serviceClient, auth.user, credentialId);
    const now = new Date().toISOString();

    const { error: credentialError } = await auth.serviceClient
      .from("provider_credentials")
      .update({
        status: "deleted",
        is_default: false,
        deleted_at: now,
        updated_at: now,
      })
      .eq("id", credentialId)
      .eq("user_id", auth.user.id);

    if (credentialError) {
      return errorResponse(request, 500, "删除托管凭据失败。");
    }

    const { error: secretError } = await auth.serviceClient
      .from("provider_credential_secrets")
      .update({
        deleted_at: now,
        updated_at: now,
      })
      .eq("credential_id", credentialId)
      .eq("user_id", auth.user.id);

    if (secretError) {
      return errorResponse(request, 500, "删除托管凭据密文失败。");
    }

    if (credential.is_default) {
      await chooseFallbackDefaultCredential(auth.serviceClient, auth.user.id);
    }

    return jsonResponse(request, {
      ok: true,
    });
  } catch {
    return errorResponse(request, 404, "未找到可删除的托管凭据。");
  }
});
