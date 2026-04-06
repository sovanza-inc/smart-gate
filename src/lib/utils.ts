import { Worker } from "@/types";

let workerCounter = 0;

export function setWorkerCounter(count: number) {
  workerCounter = count;
}

export function generateId(): string {
  workerCounter++;
  return "WRK" + String(workerCounter).padStart(3, "0");
}

export function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function nowTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function todayDate(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function generateIrisId(): string {
  const rnd = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IRIS-${rnd()}-${rnd()}`;
}

export function isExpired(w: Worker): boolean {
  return new Date() > new Date(w.expiryRaw);
}

export function daysLeft(w: Worker): number {
  return Math.ceil((new Date(w.expiryRaw).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const COLORS = ["#1f6feb","#238636","#9a6700","#b91c1c","#6e40c9","#0e7490","#9a3412"];

export function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function makeFaceCanvas(text: string, color: string): string {
  const c = document.createElement("canvas");
  c.width = 200;
  c.height = 200;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(100, 70, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(100, 185, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 50px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 100, 76);
  return c.toDataURL("image/jpeg", 0.85);
}

export function exportCSV(logs: { workerId: string; name: string; job: string; contractor: string; nationality: string; type: string; time: string; speed: number }[]) {
  const header = "Worker ID,Name,Job,Contractor,Nationality,Type,Time,Speed (s)\n";
  const rows = logs
    .map((l) => `${l.workerId},"${l.name}",${l.job},"${l.contractor}",${l.nationality},${l.type === "in" ? "Entry" : "Exit"},${l.time},${l.speed || ""}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SmartGate_Log_${todayDate().replace(/\//g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
