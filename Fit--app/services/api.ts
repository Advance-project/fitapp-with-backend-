import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Base URL of the FastAPI backend.
 *
 * Priority:
 * 1) EXPO_PUBLIC_API_URL env var
 * 2) Web: localhost
 * 3) Android emulator: 10.0.2.2 (special loopback to host machine)
 * 4) Physical device: LAN IP derived from Metro bundler host
 */
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim();
const DEFAULT_WEB_BASE_URL = "http://127.0.0.1:8000";
const ANDROID_EMULATOR_BASE_URL = "http://10.0.2.2:8000";
const REQUEST_TIMEOUT_MS = 6000;
let preferredAndroidBaseUrl: string | null = null;

function getNativeBaseUrl(): string {
  // When backend is started with `python run.py` (host="0.0.0.0"), the LAN IP
  // is reachable from BOTH emulator and physical device — no need to distinguish.
  const debuggerHost: string | undefined =
    (Constants.expoGoConfig as any)?.debuggerHost ??
    (Constants.manifest as any)?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    return `http://${host}:8000`;
  }

  // debuggerHost not available: fall back to emulator-safe address
  return ANDROID_EMULATOR_BASE_URL;
}

export const BASE_URL =
  ENV_BASE_URL && ENV_BASE_URL.length > 0
    ? ENV_BASE_URL
    : Platform.OS === "web"
    ? DEFAULT_WEB_BASE_URL
    : getNativeBaseUrl();

function getAndroidFallbackBaseUrls(): string[] {
  const urls: string[] = [];
  if (preferredAndroidBaseUrl) {
    urls.push(preferredAndroidBaseUrl);
  }
  urls.push(BASE_URL);
  const debuggerHost: string | undefined =
    (Constants.expoGoConfig as any)?.debuggerHost ??
    (Constants.manifest as any)?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    urls.push(`http://${host}:8000`);
  }

  urls.push(ANDROID_EMULATOR_BASE_URL);

  // Keep order and remove duplicates.
  return urls.filter((url, idx) => urls.indexOf(url) === idx);
}

// Debug: log resolved API URL on app startup
console.log("[API] Resolved BASE_URL:", BASE_URL);
console.log("[API] Platform:", Platform.OS);

async function fetchWithAndroidFallback(
  path: string,
  options: RequestInit,
): Promise<Response> {
  const fetchWithTimeout = async (url: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const baseUrls =
    Platform.OS === "android" && !ENV_BASE_URL
      ? getAndroidFallbackBaseUrls()
      : [BASE_URL];

  let lastError: unknown;

  for (let i = 0; i < baseUrls.length; i += 1) {
    const candidateUrl = `${baseUrls[i]}${path}`;
    try {
      if (i > 0) {
        console.log("[API] Retrying with:", candidateUrl);
      }
      const response = await fetchWithTimeout(candidateUrl);
      if (Platform.OS === "android") {
        preferredAndroidBaseUrl = baseUrls[i];
      }
      return response;
    } catch (error) {
      lastError = error;
      console.warn("[API] Fetch failed:", candidateUrl, error);
    }
  }

  throw lastError ?? new Error("Network request failed");
}

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

export type FilterOptionsResponse = {
  equipment_options: string[];
  muscle_options: string[];
};

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
};

export type LogWorkoutSetDraft = {
  id: string;
  kg: string;
  reps: string;
  done: boolean;
};

export type LogWorkoutExerciseDraft = {
  id: string;
  name: string;
  muscle: string;
  sets: LogWorkoutSetDraft[];
};

export type LogWorkoutDraftResponse = {
  user_id: string;
  exercises: LogWorkoutExerciseDraft[];
  elapsed_seconds: number;
  updated_at?: string | null;
};

export type WorkoutTemplateExercise = {
  id: string;
  name: string;
  muscle: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: WorkoutTemplateExercise[];
  updated_at?: string | null;
};

export type WorkoutHistorySet = {
  kg: number;
  reps: number;
};

export type WorkoutHistoryExercise = {
  id: string;
  name: string;
  muscle: string;
  sets: WorkoutHistorySet[];
};

export type WorkoutHistoryItem = {
  id: string;
  template_name: string;
  title: string;
  exercises: WorkoutHistoryExercise[];
  total_sets: number;
  total_volume: number;
  logged_at: string;
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

  const requestUrl = `${BASE_URL}${path}`;
  const startTime = Date.now();
  console.log("[API]", options.method || "GET", requestUrl);

  let res = await fetchWithAndroidFallback(path, { ...options, headers });

  const elapsed = Date.now() - startTime;
  console.log("[API]", res.status, requestUrl, `(${elapsed}ms)`);

  if (res.status === 401 && !AUTH_BOOTSTRAP_PATHS.has(path)) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      headers["Authorization"] = `Bearer ${nextAccessToken}`;
      res = await fetchWithAndroidFallback(path, { ...options, headers });
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

export const filterApi = {
  getOptions: () => request<FilterOptionsResponse>("/filters/options"),
};

export const exerciseApi = {
  getAll: () => request<ExerciseCatalogItem[]>("/exercises"),
};

export const logWorkoutApi = {
  getDraft: () => request<LogWorkoutDraftResponse>("/log-workout/draft"),

  saveDraft: (payload: { exercises: LogWorkoutExerciseDraft[]; elapsed_seconds: number }) =>
    request<LogWorkoutDraftResponse>("/log-workout/draft", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  clearDraft: () =>
    request<void>("/log-workout/draft", {
      method: "DELETE",
    }),
};

export const workoutApi = {
  saveLoggedWorkout: (payload: {
    template_name: string;
    exercises: WorkoutHistoryExercise[];
  }) =>
    request<WorkoutHistoryItem>("/workouts/log", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getTemplates: () => request<WorkoutTemplate[]>("/workouts/templates"),

  deleteTemplate: (templateId: string) =>
    request<void>(`/workouts/templates/${templateId}`, {
      method: "DELETE",
    }),

  getHistory: () => request<WorkoutHistoryItem[]>("/workouts/history"),
};
