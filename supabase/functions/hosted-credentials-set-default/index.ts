import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsPreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { clearDefaultCredential, getCredentialForUser } from "../_shared/credentials.ts";
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
    if (credential.status !== "active") {
      return errorResponse(request, 400, "只能将 active 状态的凭据设为默认。");
    }

    await clearDefaultCredential(auth.serviceClient, auth.user.id);
    const { data, error } = await auth.serviceClient
      .from("provider_credentials")
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentialId)
      .eq("user_id", auth.user.id)
      .select("*")
      .single();

    if (error || !data) {
      return errorResponse(request, 500, "设置默认托管凭据失败。");
    }

    return jsonResponse(request, {
      credential: data,
    });
  } catch {
    return errorResponse(request, 404, "未找到可设置的托管凭据。");
  }
});
