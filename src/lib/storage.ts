import { Worker, LogEntry } from "@/types";

const WORKERS_KEY = "sg_workers";
const LOGS_KEY = "sg_logs";
const SPEEDS_KEY = "sg_speeds";

function isAvailable(): boolean {
  try {
    const k = "__test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export const storage = {
  available: typeof window !== "undefined" && isAvailable(),

  getWorkers(): Worker[] {
    try {
      const raw = localStorage.getItem(WORKERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveWorkers(workers: Worker[]) {
    try {
      localStorage.setItem(WORKERS_KEY, JSON.stringify(workers));
    } catch {}
  },

  getLogs(): LogEntry[] {
    try {
      const raw = localStorage.getItem(LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLogs(logs: LogEntry[]) {
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    } catch {}
  },

  getSpeeds(): number[] {
    try {
      const raw = localStorage.getItem(SPEEDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveSpeeds(speeds: number[]) {
    try {
      localStorage.setItem(SPEEDS_KEY, JSON.stringify(speeds));
    } catch {}
  },
};
