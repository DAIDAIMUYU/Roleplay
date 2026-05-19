import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsPreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { errorResponse, jsonResponse } from "../_shared/json.ts";

serve(async (request) => {
  const preflight = handleCorsPreflight(request);
  if (preflight) return preflight;

  if (request.method !== "GET") {
    return errorResponse(request, 405, "Method not allowed.");
  }

  const auth = await requireUser(request);
  if (!auth.user) return auth.errorResponse;

  const { data, error } = await auth.serviceClient
    .from("provider_credentials")
    .select("*")
    .eq("user_id", auth.user.id)
    .is("deleted_at", null)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });

  if (error) {
    return errorResponse(request, 500, "读取托管凭据列表失败。");
  }

  return jsonResponse(request, {
    credentials: data ?? [],
  });
});
