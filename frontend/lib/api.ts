const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
// Clean trailing slashes and redundant /api/v1 suffixes
let baseHost = rawApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
// Normalize localhost to 127.0.0.1 on local environments to prevent 2-second Windows IPv6 ::1 timeout
if (baseHost.includes("localhost:8000")) {
  baseHost = baseHost.replace("localhost:8000", "127.0.0.1:8000");
}

export const API_BASE = baseHost;
export const API_V1 = `${baseHost}/api/v1`;

export function getFrontendBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return "https://testora-quiz-f.onrender.com";
}

export function getWebSocketUrl(path: string): string {
  const wsProtocol = API_BASE.startsWith("https") ? "wss" : "ws";
  const host = API_BASE.replace(/^https?:\/\//, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${wsProtocol}://${host}${normalizedPath}`;
}

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token, headers, ...rest } = options;
  const h: Record<string, string> = { ...(headers as Record<string, string>) };
  
  // Resolve token from parameter or fallback to localStorage
  const effectiveToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  if (effectiveToken && !h["Authorization"]) {
    h["Authorization"] = `Bearer ${effectiveToken}`;
  }

  // Inject Workspace ID if present in storage and not already set
  if (typeof window !== "undefined") {
    const wsId = localStorage.getItem("workspaceId");
    if (wsId && !h["X-Workspace-Id"]) {
      h["X-Workspace-Id"] = wsId;
    }
  }

  if (!h["Content-Type"] && !(options.body instanceof FormData)) {
    h["Content-Type"] = "application/json";
  }

  // Normalize path
  let normalizedPath = path;
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }

  // If path already has /api/v1 prefix, strip it because API_V1 includes it
  if (normalizedPath.startsWith("/api/v1")) {
    normalizedPath = normalizedPath.substring(7);
  }

  const url = `${API_V1}${normalizedPath}`;

  return fetch(url, {
    ...rest,
    headers: h,
  });
}
