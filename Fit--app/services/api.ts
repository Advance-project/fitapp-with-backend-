import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Base URL of the FastAPI backend.
 *
 * Physical device on the same WiFi as your PC → use your PC's LAN IP (found in Expo output).
 * Android emulator only → use http://10.0.2.2:8000
 *
 * Your PC's detected LAN IP: 192.168.68.105
 * Change this if your IP changes.
 */
export const BASE_URL = "http://192.168.68.105:8000";

export const TOKEN_KEY = "auth_token";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

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
  return data as T;
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export const saveToken = (token: string) =>
  AsyncStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => AsyncStorage.removeItem(TOKEN_KEY);

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

  getMe: () => request<AuthUser>("/auth/me"),

  updateMe: (fields: { username?: string; password?: string }) =>
    request<AuthUser>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(fields),
    }),

  deleteMe: () =>
    request<void>("/auth/me", { method: "DELETE" }),
};
