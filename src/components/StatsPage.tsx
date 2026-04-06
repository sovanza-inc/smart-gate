"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import { isExpired, todayDate } from "@/lib/utils";

type Tab = "summary" | "detail" | "contractor" | "nationality" | "speed";

export default function StatsPage() {
  const { workers, logs, speeds, lang } = useStore();
  const t = translations[lang];
  const [tab, setTab] = useState<Tab>("summary");

  const today = todayDate();
  const todayLogs = logs.filter((l) => l.date === today);
  const insideCount = workers.filter((w) => w.status === "inside").length;
  const activeCount = workers.filter((w) => !isExpired(w)).length;
  const expiredCount = workers.filter(isExpired).length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "summary", label: t.summary },
    { id: "detail", label: t.detailed },
    { id: "contractor", label: t.byContractor },
    { id: "nationality", label: t.byNationality },
    { id: "speed", label: t.speedAnalysis },
  ];

  return (
    <div className="p-4 max-w-[900px] mx-auto">
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">{t.statistics}</h3>

        <div className="flex gap-1.5 mb-4 flex-wrap">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold min-h-[36px] border transition-colors ${
                tab === tb.id ? "bg-accent border-accent text-white" : "bg-border2 border-border text-text2"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {tab === "summary" && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-bg2 border border-border rounded-lg p-3 text-center">
                <div className="text-2xl font-extrabold text-green2">{todayLogs.filter((l) => l.type === "in").length}</div>
                <div className="text-[0.69rem] text-text2">{t.entriesToday}</div>
              </div>
              <div className="bg-bg2 border border-border rounded-lg p-3 text-center">
                <div className="text-2xl font-extrabold text-red2">{todayLogs.filter((l) => l.type === "out").length}</div>
                <div className="text-[0.69rem] text-text2">{t.exitsToday}</div>
              </div>
              <div className="bg-bg2 border border-border rounded-lg p-3 text-center">
                <div className="text-2xl font-extrabold text-[#58a6ff]">{insideCount}</div>
                <div className="text-[0.69rem] text-text2">{t.insideNow}</div>
              </div>
            </div>
            <div className="bg-bg rounded-lg p-3 text-sm leading-[2.1]">
              <div>{t.date}: <strong>{today}</strong></div>
              <div>{t.totalRegistered}: <strong>{workers.length}</strong></div>
              <div>{t.activeCards}: <strong className="text-green2">{activeCount}</strong></div>
              <div>{t.expiredCards}: <strong className="text-red2">{expiredCount}</strong></div>
              <div>{t.totalOpsToday}: <strong className="text-yellow">{todayLogs.length}</strong></div>
            </div>
          </>
        )}

        {tab === "detail" && (
          todayLogs.length === 0 ? (
            <p className="text-center text-text2 py-5 text-sm">{t.noOps}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-bg3">
                    {["#", "Name", "ID", "Job", "Contractor", "Type", "Time", "Speed"].map((h) => (
                      <th key={h} className="p-2 text-left text-text2 font-bold uppercase border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayLogs.map((l, i) => (
                    <tr key={i}>
                      <td className="p-2 border-b border-border2">{i + 1}</td>
                      <td className="p-2 border-b border-border2">{l.name}</td>
                      <td className="p-2 border-b border-border2">{l.workerId}</td>
                      <td className="p-2 border-b border-border2">{l.job}</td>
                      <td className="p-2 border-b border-border2">{l.contractor}</td>
                      <td className={`p-2 border-b border-border2 font-bold ${l.type === "in" ? "text-green2" : "text-red2"}`}>{l.type === "in" ? "Entry" : "Exit"}</td>
                      <td className="p-2 border-b border-border2">{l.time}</td>
                      <td className="p-2 border-b border-border2">{l.speed ? `${l.speed}s` : "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "contractor" && (() => {
          const map: Record<string, { inside: number; outside: number; entries: number; exits: number }> = {};
          workers.forEach((w) => {
            if (!map[w.contractor]) map[w.contractor] = { inside: 0, outside: 0, entries: 0, exits: 0 };
            if (w.status === "inside") map[w.contractor].inside++;
            else map[w.contractor].outside++;
          });
          todayLogs.forEach((l) => {
            if (!map[l.contractor]) map[l.contractor] = { inside: 0, outside: 0, entries: 0, exits: 0 };
            if (l.type === "in") map[l.contractor].entries++;
            else map[l.contractor].exits++;
          });
          if (!Object.keys(map).length) return <p className="text-center text-text2 py-5 text-sm">{t.noData}</p>;
          return (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-bg3">
                    {[t.contractorCompany, t.inside, t.outside, t.entries, t.exits].map((h) => (
                      <th key={h} className="p-2 text-left text-text2 font-bold uppercase border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(map).map(([name, s]) => (
                    <tr key={name}>
                      <td className="p-2 border-b border-border2 font-bold">{name}</td>
                      <td className="p-2 border-b border-border2 text-green2 font-bold">{s.inside}</td>
                      <td className="p-2 border-b border-border2 text-text2">{s.outside}</td>
                      <td className="p-2 border-b border-border2 text-green2">{s.entries}</td>
                      <td className="p-2 border-b border-border2 text-red2">{s.exits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {tab === "nationality" && (() => {
          const map: Record<string, { total: number; inside: number }> = {};
          workers.forEach((w) => {
            const nat = w.nationality || "Not specified";
            if (!map[nat]) map[nat] = { total: 0, inside: 0 };
            map[nat].total++;
            if (w.status === "inside") map[nat].inside++;
          });
          if (!Object.keys(map).length) return <p className="text-center text-text2 py-5 text-sm">{t.noData}</p>;
          const sorted = Object.entries(map).sort((a, b) => b[1].total - a[1].total);
          return (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-bg3">
                    {[t.nationality, t.total, t.inside, "%"].map((h) => (
                      <th key={h} className="p-2 text-left text-text2 font-bold uppercase border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(([name, s]) => {
                    const pct = workers.length > 0 ? Math.round((s.total / workers.length) * 100) : 0;
                    return (
                      <tr key={name}>
                        <td className="p-2 border-b border-border2 font-bold">{name}</td>
                        <td className="p-2 border-b border-border2 font-bold">{s.total}</td>
                        <td className="p-2 border-b border-border2 text-green2">{s.inside}</td>
                        <td className="p-2 border-b border-border2">
                          <div className="bg-bg rounded h-4 relative overflow-hidden">
                            <div className="bg-accent h-full" style={{ width: `${pct}%` }} />
                            <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-bold">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

        {tab === "speed" && (() => {
          const manualAvg = 45;
          const autoAvg = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
          const fastest = speeds.length > 0 ? Math.min(...speeds) : 0;
          const slowest = speeds.length > 0 ? Math.max(...speeds) : 0;
          const timeSaved = manualAvg - autoAvg;
          const dailySavedMin = Math.round((700 * timeSaved) / 60);

          return (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-bg2 border border-border rounded-lg p-3 text-center">
                  <div className="text-2xl font-extrabold text-red2">{manualAvg}s</div>
                  <div className="text-[0.69rem] text-text2">{t.manualAvg}</div>
                </div>
                <div className="bg-bg2 border border-border rounded-lg p-3 text-center">
                  <div className="text-2xl font-extrabold text-green2">{autoAvg ? autoAvg.toFixed(1) : "--"}s</div>
                  <div className="text-[0.69rem] text-text2">{t.smartGateAvg}</div>
                </div>
                <div className="bg-bg2 border border-border rounded-lg p-3 text-center">
                  <div className="text-2xl font-extrabold text-cyan">{timeSaved > 0 ? timeSaved.toFixed(0) : "--"}s</div>
                  <div className="text-[0.69rem] text-text2">{t.savedPerWorker}</div>
                </div>
              </div>

              <div className="bg-bg rounded-lg p-4 mb-3">
                <div className="font-bold text-sm mb-2">{t.speedAnalysis}</div>
                <div className="text-sm leading-[2]">
                  {t.verificationsRecorded}: <strong>{speeds.length}</strong><br />
                  {t.fastest}: <strong className="text-green2">{fastest ? fastest.toFixed(1) : "--"}s</strong><br />
                  {t.slowest}: <strong className="text-red2">{slowest ? slowest.toFixed(1) : "--"}s</strong><br />
                  {t.estimatedDaily}: <strong className="text-cyan">{dailySavedMin} {t.minutes}</strong>
                </div>
              </div>

              <div className="bg-[#0a1f0f] border border-green rounded-lg p-4">
                <div className="font-bold text-sm text-green2 mb-2">{t.perfComparison}</div>
                <div className="flex gap-3 mt-2">
                  <div className="flex-1 text-center">
                    <div
                      className="bg-red rounded-t-md mb-1 flex items-center justify-center text-white font-extrabold text-lg"
                      style={{ height: Math.min(manualAvg * 3, 150) }}
                    >
                      {manualAvg}s
                    </div>
                    <div className="text-xs text-text2">{t.manual}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div
                      className="bg-green rounded-t-md mb-1 flex items-center justify-center text-white font-extrabold text-lg"
                      style={{ height: Math.min((autoAvg || 5) * 3, 150) }}
                    >
                      {autoAvg ? autoAvg.toFixed(1) : "?"}s
                    </div>
                    <div className="text-xs text-text2">Smart Gate</div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
