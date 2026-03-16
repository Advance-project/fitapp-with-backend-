import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Base URL of the FastAPI backend.
 *
 * Physical device on the same WiFi as your PC → use your PC's LAN IP (found in Expo output).
 * Android emulator only → use http://10.0.2.2:8000
 *
 * Your PC's detected LAN IP: 192.168.68.103
 * Change this if your IP changes.
 */
export const BASE_URL = "http://192.168.68.103:8000";

export const TOKEN_KEY = "auth_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
};

export type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

// ── Core fetch helper ─────────────────────────────────────────────────────────

const AUTH_BOOTSTRAP_PATHS = new Set([
  "/auth/signup",
  "/auth/login",
  "/auth/admin-login",
  "/auth/refresh",
]);

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    await clearToken();
    return null;
  }

  const data = (await res.json()) as RefreshResponse;
  await saveTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token && !AUTH_BOOTSTRAP_PATHS.has(path)) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !AUTH_BOOTSTRAP_PATHS.has(path)) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      headers["Authorization"] = `Bearer ${nextAccessToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
  }

  const raw = await res.text();
  let data: any = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    // FastAPI returns { detail: "..." } for errors
    const msg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map((e: any) => e.msg).join(", ")
        : "Something went wrong";
    throw new Error(msg);
  }
  if (res.status === 204 || data === null) {
    return undefined as T;
  }
  return data as T;
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export const saveTokens = (accessToken: string, refreshToken: string) =>
  AsyncStorage.multiSet([
    [TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);

export const clearToken = () =>
  AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);

// ── Auth endpoints ────────────────────────────────────────────────────────────

export const authApi = {
  signup: (email: string, username: string, password: string) =>
    request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  adminLogin: (username: string, password: string) =>
    request<AuthResponse>("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request<AuthUser>("/auth/me"),

  updateMe: (fields: { username?: string; password?: string }) =>
    request<AuthUser>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(fields),
    }),

  deleteMe: () =>
    request<void>("/auth/me", { method: "DELETE" }),
};
