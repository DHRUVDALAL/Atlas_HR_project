// API client for Atlas HR FastAPI backend.
// In Docker/production, VITE_API_BASE_URL is not set → empty string → relative URLs via nginx proxy.
// For local dev, create a .env file with VITE_API_BASE_URL=http://localhost:8000
const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
const defaultUrl = import.meta.env.PROD
  ? "" // In production, use relative paths so IIS/Nginx reverse proxy handles it
  : host === "localhost"
    ? "http://localhost:8001"
    : `http://${host}:8001`;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined 
  ? import.meta.env.VITE_API_BASE_URL 
  : defaultUrl;

const ACCESS_KEY = "atlas.access_token";
const REFRESH_KEY = "atlas.refresh_token";
const USER_KEY = "atlas.user";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}
export function setStoredUser(user: unknown) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return null;
  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string };
  setTokens(data.access_token);
  return data.access_token;
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  raw?: boolean; // if true, body is passed as-is (FormData, URLSearchParams)
  auth?: boolean; // default true
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { body, raw, auth = true, headers, ...rest } = opts;
  const url = `${API_BASE_URL}${path}`;
  const buildHeaders = (token: string | null): HeadersInit => {
    const h: Record<string, string> = { ...(headers as Record<string, string> | undefined) };
    if (!raw && body !== undefined && !(body instanceof FormData)) {
      h["Content-Type"] = h["Content-Type"] ?? "application/json";
    }
    if (auth && token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  const doFetch = async (token: string | null) => {
    const finalBody = raw
      ? (body as BodyInit)
      : body instanceof FormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined;
    try {
      return await fetch(url, { ...rest, headers: buildHeaders(token), body: finalBody });
    } catch (e) {
      throw new ApiError(
        `Cannot reach backend at ${API_BASE_URL}. Set VITE_API_BASE_URL to your FastAPI URL.`,
        0,
        e,
      );
    }
  };

  const token = auth ? getAccessToken() : null;
  let res = await doFetch(token);
  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      clearAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  }

  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      /* ignore */
    }
    const msg =
      (detail as { detail?: string } | null)?.detail ?? `Request failed with status ${res.status}`;
    throw new ApiError(typeof msg === "string" ? msg : "Request failed", res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail: unknown,
  ) {
    super(message);
  }
}
