export function resolveApiBase(): string {
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const h = window.location.hostname.toLowerCase();
    if (h.includes("testoraquiz.com") || (!h.includes("localhost") && !h.includes("127.0.0.1") && !h.startsWith("192.168."))) {
      return "https://api.testoraquiz.com";
    }
  }

  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  let baseHost = rawApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
  if (baseHost.includes("localhost:8000")) {
    baseHost = baseHost.replace("localhost:8000", "127.0.0.1:8000");
  }
  return baseHost;
}

export function getApiBase(): string {
  return resolveApiBase();
}

export function getApiV1(): string {
  return `${resolveApiBase()}/api/v1`;
}

export const API_BASE = resolveApiBase();
export const API_V1 = `${resolveApiBase()}/api/v1`;

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

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_V1}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.access_token) {
          if (typeof window !== "undefined") {
            localStorage.setItem("token", data.access_token);
            const maxAge = 3650 * 86400;
            document.cookie = `token=${encodeURIComponent(data.access_token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
          }
          return data.access_token as string;
        }
      }
    } catch {}
    return null;
  })().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token, headers, ...rest } = options;
  const h: Record<string, string> = { ...(headers as Record<string, string>) };
  
  // Resolve token from parameter or fallback to localStorage / persistent cookie
  const effectiveToken = token || (typeof window !== "undefined" ? (localStorage.getItem("token") || getCookie("token")) : null);
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

  const currentApiV1 = getApiV1();
  const url = `${currentApiV1}${normalizedPath}`;

  const response = await fetch(url, {
    credentials: "include",
    ...rest,
    headers: h,
  });

  // Seamless Auto-Refresh Interceptor: If token expired (401), refresh & retry automatically
  if (response.status === 401 && !normalizedPath.includes("/auth/login") && !normalizedPath.includes("/auth/refresh")) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      h["Authorization"] = `Bearer ${newToken}`;
      return fetch(url, {
        credentials: "include",
        ...rest,
        headers: h,
      });
    }
  }

  return response;
}
