export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000";

export type AuthUser = {
  id: string;
  name?: string | null;
  employeeId?: string | null;
  username?: string | null;
  email: string;
  role?: string | null;
  department?: string | null;
  photo?: string | null;
  status?: string | null;
};

export type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  token?: string | null;
  headers?: HeadersInit;
};

const isBrowser = typeof window !== "undefined";

export function getApiUrl(path: string) {
  if (!path) return API_URL;
  return path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function withApiAssetUrl(assetPath?: string | null) {
  if (!assetPath) return assetPath ?? "";
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  return getApiUrl(assetPath);
}

export function getStoredToken() {
  if (!isBrowser) return null;
  return window.localStorage.getItem("token");
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser) return null;

  const raw = window.localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  if (!isBrowser) return;
  window.localStorage.setItem("token", token);
  window.localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuthSession() {
  if (!isBrowser) return;
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("user");
}

export function normalizeRole(role?: string | null) {
  return (role || "").toString().trim().toLowerCase();
}

export function isAdmin(role?: string | null) {
  return normalizeRole(role) === "admin";
}

export function decodeJwtPayload<T = Record<string, unknown>>(
  token?: string | null,
): T | null {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    if (!isBrowser) return null;

    return JSON.parse(window.atob(padded)) as T;
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token = getStoredToken(), headers, ...rest } = options;

  const finalHeaders = new Headers(headers);

  if (token && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const hasBody =
    rest.body !== undefined &&
    rest.body !== null &&
    !(rest.body instanceof FormData);

  if (hasBody && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(getApiUrl(path), {
    ...rest,
    headers: finalHeaders,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : typeof payload === "string" && payload
          ? payload
          : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

export function toJsonBody(value: unknown) {
  return JSON.stringify(value);
}
