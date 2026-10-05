"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export class ApiError extends Error {}

export async function api<T = any>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`/api${path}`, {
    ...rest,
    headers: { "content-type": "application/json", ...(rest.headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(data?.detail ?? `${res.status} ${res.statusText}`);
  return data as T;
}

export const post = <T = any>(path: string, json: unknown = {}) => api<T>(path, { method: "POST", json });

/** Fetch + poll. Returns data, error, reload. */
export function usePoll<T>(path: string | null, intervalMs = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const load = useCallback(async () => {
    if (!path) return;
    try {
      const d = await api<T>(path);
      if (alive.current) {
        setData(d);
        setError(null);
      }
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    }
  }, [path]);
  useEffect(() => {
    alive.current = true;
    const first = setTimeout(load, 0);
    const t = intervalMs ? setInterval(load, intervalMs) : undefined;
    return () => {
      alive.current = false;
      clearTimeout(first);
      if (t) clearInterval(t);
    };
  }, [load, intervalMs]);
  return { data, error, reload: load };
}

export async function waitJob(jobId: number, onTick?: (j: any) => void): Promise<any> {
  for (;;) {
    const j = await api(`/jobs/${jobId}`);
    onTick?.(j);
    if (j.status === "done") return j.result;
    if (j.status === "error") throw new ApiError(j.message?.split("\n")[0] ?? "job failed");
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// ---------------------------------------------------------------- selected connection
const KEY = "learnsql.connection";
const EVENT = "learnsql-connection";

function readSaved(): number | null {
  try {
    return Number(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Selected connection id (persisted per browser), falling back to the first connection. */
export function useConnection(): [number | null, (id: number) => void, any[]] {
  const { data } = usePoll<any[]>("/connections", 15000);
  const saved = useSyncExternalStore(subscribe, readSaved, () => null);
  const list = data ?? [];
  const id = list.find((c) => c.id === saved)?.id ?? list[0]?.id ?? null;
  const choose = (v: number) => {
    try {
      localStorage.setItem(KEY, String(v));
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  };
  return [id, choose, list];
}

// ---------------------------------------------------------------- formatting
export const fmt = {
  ms: (v?: number | null) => (v == null ? "—" : v >= 100 ? `${v.toFixed(0)} ms` : v >= 10 ? `${v.toFixed(1)} ms` : `${v.toFixed(2)} ms`),
  n: (v?: number | null, d = 0) => (v == null ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: d })),
  pct: (v?: number | null, d = 1) => (v == null ? "—" : `${(v * 100).toFixed(d)}%`),
  mb: (b?: number | null) => (b == null ? "—" : `${(b / 1e6).toFixed(2)} MB`),
  time: (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString() : "—"),
  ago: (iso?: string | null) => {
    if (!iso) return "—";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return `${Math.max(0, Math.round(s))}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    return `${Math.round(s / 3600)}h ago`;
  },
};

export const LABEL: Record<string, string> = {
  no_index: "Current (no index)",
  btree: "B-tree",
  learned_hash: "Learned hash",
  hybrid: "Hybrid",
};
