import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsPreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { decryptApiKey } from "../_shared/crypto.ts";
import { getCredentialForUser } from "../_shared/credentials.ts";
import { errorResponse, jsonResponse } from "../_shared/json.ts";
import { mapProviderError, normalizeBaseUrl, providerChat, providerChatStream } from "../_shared/provider.ts";

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

  const credentialId =
    typeof body.credential_id === "string"
      ? body.credential_id
      : typeof body.credentialId === "string"
        ? body.credentialId
        : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const temperature = typeof body.temperature === "number" ? body.temperature : undefined;
  const maxTokens = typeof body.max_tokens === "number" ? body.max_tokens : undefined;
  const stream = body.stream === true;

  if (!credentialId) {
    return errorResponse(request, 400, "缺少 credential_id。");
  }

  if (!model) {
    return errorResponse(request, 400, "缺少 model。");
  }

  if (!messages.length) {
    return errorResponse(request, 400, "messages 不能为空。");
  }

  try {
    const { credential, secret } = await getCredentialForUser(auth.serviceClient, auth.user, credentialId);
    const apiKey = await decryptApiKey(secret.encrypted_api_key, secret.encryption_iv);
    const baseUrl = normalizeBaseUrl(credential.provider_type, credential.base_url);

    if (stream) {
      // ── Streaming path ──
      // providerChatStream returns a Response with text/event-stream.
      // We return it directly after updating last_used_at as a fire-and-forget.
      const streamResponse = await providerChatStream({
        providerType: credential.provider_type,
        baseUrl,
        apiKey,
        model,
        messages: messages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
        temperature,
        maxTokens,
      });

      // Update last_used_at (fire-and-forget — don't block the stream)
      auth.serviceClient
        .from("provider_credentials")
        .update({
          last_used_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", credential.id)
        .eq("user_id", auth.user.id)
        .then(
          () => {},
          () => {},
        );

      return streamResponse;
    }

    // ── Non-streaming path (legacy, backward compatible) ──
    const result = await providerChat({
      providerType: credential.provider_type,
      baseUrl,
      apiKey,
      model,
      messages: messages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
      temperature,
      maxTokens,
    });

    await auth.serviceClient
      .from("provider_credentials")
      .update({
        last_used_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credential.id)
      .eq("user_id", auth.user.id);

    return jsonResponse(request, result);
  } catch (error) {
    const mapped = mapProviderError(error);
    await auth.serviceClient
      .from("provider_credentials")
      .update({
        last_error: mapped.detail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentialId)
      .eq("user_id", auth.user.id)
      .is("deleted_at", null);

    return errorResponse(request, mapped.status, mapped.detail);
  }
});