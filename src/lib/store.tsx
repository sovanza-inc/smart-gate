"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Worker, LogEntry, Lang } from "@/types";
import { setWorkerCounter } from "./utils";

interface StoreState {
  workers: Worker[];
  logs: LogEntry[];
  speeds: number[];
  lang: Lang;
  setWorkers: (fn: (prev: Worker[]) => Worker[]) => void;
  setLogs: (fn: (prev: LogEntry[]) => LogEntry[]) => void;
  addSpeed: (speed: number) => void;
  setLang: (lang: Lang) => void;
}

const StoreContext = createContext<StoreState | null>(null);

async function api(path: string, method = "GET", body?: unknown) {
  const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  return res.json();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [workers, setWorkersRaw] = useState<Worker[]>([]);
  const [logs, setLogsRaw] = useState<LogEntry[]>([]);
  const [speeds, setSpeedsRaw] = useState<number[]>([]);
  const [lang, setLangRaw] = useState<Lang>("en");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      // Init DB tables
      await api("/api/init", "POST");
      // Load all data
      const [w, l, s] = await Promise.all([
        api("/api/workers"),
        api("/api/logs"),
        api("/api/speeds"),
      ]);
      setWorkersRaw(Array.isArray(w) ? w : []);
      setLogsRaw(Array.isArray(l) ? l : []);
      setSpeedsRaw(Array.isArray(s) ? s : []);
      setWorkerCounter(Array.isArray(w) ? w.length : 0);
      try {
        const savedLang = localStorage.getItem("sg_lang") as Lang;
        if (savedLang === "ar" || savedLang === "en") setLangRaw(savedLang);
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangRaw(newLang);
    try { localStorage.setItem("sg_lang", newLang); } catch {}
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  }, []);

  const setWorkers = useCallback((fn: (prev: Worker[]) => Worker[]) => {
    setWorkersRaw((prev) => {
      const next = fn(prev);
      setWorkerCounter(next.length);

      // Detect what changed and sync to DB
      const added = next.filter((w) => !prev.find((p) => p.id === w.id));
      const removed = prev.filter((p) => !next.find((w) => w.id === p.id));
      const updated = next.filter((w) => {
        const old = prev.find((p) => p.id === w.id);
        return old && (old.status !== w.status || old.lastEntry !== w.lastEntry);
      });

      added.forEach((w) => api("/api/workers", "POST", w));
      removed.forEach((w) => api("/api/workers", "DELETE", { id: w.id }));
      updated.forEach((w) => api("/api/workers", "PUT", w));

      return next;
    });
  }, []);

  const setLogs = useCallback((fn: (prev: LogEntry[]) => LogEntry[]) => {
    setLogsRaw((prev) => {
      const next = fn(prev);
      // New logs are prepended, so find the new ones
      const newLogs = next.slice(0, next.length - prev.length);
      newLogs.forEach((l) => api("/api/logs", "POST", l));
      return next;
    });
  }, []);

  const addSpeed = useCallback((speed: number) => {
    setSpeedsRaw((prev) => [...prev, speed]);
    api("/api/speeds", "POST", { value: speed });
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="text-2xl animate-pulse text-cyan mb-2">Loading Smart Gate...</div>
          <div className="text-sm text-text2">Connecting to database</div>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider value={{ workers, logs, speeds, lang, setWorkers, setLogs, addSpeed, setLang }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
