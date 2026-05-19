import { buildCorsHeaders } from "./cors.ts";

export function jsonResponse(
  request: Request,
  body: unknown,
  init?: ResponseInit,
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...buildCorsHeaders(request.headers.get("origin")),
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(
  request: Request,
  status: number,
  detail: string,
): Response {
  return jsonResponse(
    request,
    {
      detail,
    },
    {
      status,
    },
  );
}
