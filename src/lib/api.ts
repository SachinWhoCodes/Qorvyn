import { auth } from "@/lib/firebase";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "";

type ApiFetchOptions = RequestInit & { json?: unknown };

export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

