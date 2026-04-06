"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import { Worker } from "@/types";
import { isExpired, nowTime, todayDate, exportCSV as doExportCSV } from "@/lib/utils";
import Avatar from "./Avatar";
import Alert from "./Alert";

export default function SecurityPage() {
  const { workers, setWorkers, logs, setLogs, speeds, addSpeed, lang } = useStore();
  const t = translations[lang];

  const [alert, setAlert] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [searchVal, setSearchVal] = useState("");
  const [suggestions, setSuggestions] = useState<Worker[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const [verifyStart, setVerifyStart] = useState<number | null>(null);
  const [lastSpeed, setLastSpeed] = useState<string>("0.0");
  const [scanning, setScanning] = useState(false);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const today = todayDate();
  const todayLogs = logs.filter((l) => l.date === today);
  const insideWorkers = workers.filter((w) => w.status === "inside");

  const autoAvg = speeds.length > 0 ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1) : "--";
  const timeSaved = speeds.length > 0 ? (45 - parseFloat(autoAvg as string)).toFixed(0) : "--";

  function liveSearch(val: string) {
    setSearchVal(val);
    if (!val || val.length < 1) { setSuggestions([]); return; }
    const hits = workers.filter((w) =>
      w.id.toLowerCase().includes(val.toLowerCase()) || w.name.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 6);
    setSuggestions(hits);
  }

  function searchWorker(overrideVal?: string) {
    setVerifyStart(performance.now());
    const val = (overrideVal || searchVal).trim();
    setSuggestions([]);
    if (!val) { setAlert({ type: "err", msg: "Enter worker ID or name" }); return; }
    const w = workers.find((x) => x.id.toLowerCase() === val.toLowerCase() || x.name.toLowerCase().includes(val.toLowerCase()));
    if (!w) { setAlert({ type: "err", msg: t.notFound }); setCurrentWorker(null); return; }
    if (isExpired(w)) { setAlert({ type: "err", msg: t.cardExpired }); return; }
    setTelegramCode(null);
    setCodeInput("");
    setCodeVerified(false);
    setCurrentWorker(w);
    setAlert({ type: "ok", msg: `${t.found}${w.name} (${w.id})` });
  }

  async function sendTelegramCode() {
    if (!currentWorker) return;
    if (!currentWorker.telegram) {
      setAlert({ type: "err", msg: t.noTelegram });
      return;
    }
    setCodeSending(true);
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setTelegramCode(code);

    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: currentWorker.telegram, code, workerName: currentWorker.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "err", msg: data.error || "Failed to send code" });
        setTelegramCode(null);
      } else {
        setAlert({ type: "ok", msg: t.codeSent });
      }
    } catch {
      setAlert({ type: "err", msg: "Failed to send Telegram code" });
      setTelegramCode(null);
    }
    setCodeSending(false);
  }

  function verifyCode() {
    if (!telegramCode) return;
    if (codeInput.trim() === telegramCode) {
      setCodeVerified(true);
      setAlert({ type: "ok", msg: t.codeVerified });
    } else {
      setAlert({ type: "err", msg: t.codeInvalid });
    }
  }

  function doLog(type: "in" | "out") {
    if (!currentWorker) return;
    const w = currentWorker;
    if (type === "in" && w.status === "inside") { setAlert({ type: "err", msg: t.alreadyInside }); return; }
    if (type === "out" && w.status === "outside") { setAlert({ type: "err", msg: t.notInside }); return; }
    if (type === "in" && !codeVerified) { setAlert({ type: "err", msg: t.verifyFirst }); return; }

    let elapsed = 0;
    if (verifyStart) {
      elapsed = parseFloat(((performance.now() - verifyStart) / 1000).toFixed(1));
      addSpeed(elapsed);
      setLastSpeed(elapsed.toFixed(1));
      setVerifyStart(null);
    }

    const time = nowTime();
    setWorkers((prev) =>
      prev.map((x) => x.id === w.id ? { ...x, status: type === "in" ? "inside" : "outside", lastEntry: type === "in" ? time : x.lastEntry } : x)
    );
    setLogs((prev) => [{
      workerId: w.id, name: w.name, job: w.job, contractor: w.contractor,
      nationality: w.nationality, facePhoto: w.facePhoto,
      type, time, date: todayDate(), speed: elapsed,
    }, ...prev]);

    setCurrentWorker({ ...w, status: type === "in" ? "inside" : "outside", lastEntry: type === "in" ? time : w.lastEntry });
    const prefix = type === "in" ? t.entryLogged : t.exitLogged;
    setAlert({ type: "ok", msg: `${prefix}${w.name}${elapsed ? ` (${elapsed}s)` : ""}` });

    if (batchMode) {
      setBatchCount((c) => c + 1);
      setTimeout(() => {
        setSearchVal("");
        setCurrentWorker(null);
        setTelegramCode(null);
        setCodeInput("");
        setCodeVerified(false);
        searchRef.current?.focus();
      }, 1200);
    }
  }

  function manualExit(id: string) {
    const w = workers.find((x) => x.id === id);
    if (!w || !confirm(`Log exit for ${w.name}?`)) return;
    const time = nowTime();
    setWorkers((prev) => prev.map((x) => x.id === id ? { ...x, status: "outside" } : x));
    setLogs((prev) => [{
      workerId: w.id, name: w.name, job: w.job, contractor: w.contractor,
      nationality: w.nationality, facePhoto: w.facePhoto,
      type: "out", time, date: todayDate(), speed: 0,
    }, ...prev]);
  }

  function handleExportCSV() {
    if (todayLogs.length === 0) { window.alert("No data to export"); return; }
    doExportCSV(todayLogs);
  }

  // QR scanning
  const stopCam = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  async function toggleCam() {
    if (scanning) { await stopCam(); return; }
    try {
      const scannerId = "qr-reader";
      // Ensure container exists
      if (!document.getElementById(scannerId)) return;

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          const workerId = decodedText.trim();
          setSearchVal(workerId);
          stopCam().then(() => {
            searchWorker(workerId);
          });
        },
        () => {} // ignore scan failures (no QR in frame)
      );
    } catch {
      await stopCam();
      setAlert({ type: "err", msg: "Camera error - use manual search" });
    }
  }

  useEffect(() => { return () => { stopCam(); }; }, [stopCam]);

  return (
    <div className="p-4 max-w-[900px] mx-auto">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
        {[
          { val: workers.length, label: t.total, color: "#58a6ff" },
          { val: insideWorkers.length, label: t.inside, color: "var(--color-green2)" },
          { val: todayLogs.length, label: t.ops, color: "var(--color-yellow)" },
          { val: todayLogs.filter((l) => l.type === "in").length, label: t.entries, color: "var(--color-green2)" },
          { val: todayLogs.filter((l) => l.type === "out").length, label: t.exits, color: "var(--color-red2)" },
        ].map((s) => (
          <div key={s.label} className="bg-bg2 border border-border rounded-lg p-3 text-center">
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[0.69rem] text-text2 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Speed Box */}
      <div className="bg-[#0d2035] border border-accent rounded-lg p-3 text-center mb-3">
        <div className="text-3xl font-extrabold text-cyan">{lastSpeed}s</div>
        <div className="text-xs text-text2 mt-1">{t.verificationSpeed}</div>
        <div className="flex gap-3 mt-2">
          <div className="flex-1 bg-bg rounded-lg py-2 text-center">
            <div className="text-base font-extrabold text-red2">45s</div>
            <div className="text-[0.68rem] text-text2">{t.manualAvg}</div>
          </div>
          <div className="flex-1 bg-bg rounded-lg py-2 text-center">
            <div className="text-base font-extrabold text-green2">{autoAvg}s</div>
            <div className="text-[0.68rem] text-text2">{t.smartGateAvg}</div>
          </div>
          <div className="flex-1 bg-bg rounded-lg py-2 text-center">
            <div className="text-base font-extrabold text-cyan">{timeSaved}s</div>
            <div className="text-[0.68rem] text-text2">{t.timeSaved}</div>
          </div>
        </div>
      </div>

      {/* Batch Mode */}
      <div className="bg-bg2 border border-border rounded-lg p-3 mb-3 flex items-center gap-3">
        <span className="text-sm font-bold">{t.batchMode}</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={batchMode} onChange={(e) => { setBatchMode(e.target.checked); if (!e.target.checked) setBatchCount(0); }} />
          <span className="text-xs text-text2">{t.batchDesc}</span>
        </label>
        <div className="ml-auto text-xl font-extrabold text-cyan">{batchCount}</div>
      </div>

      {/* Find Worker */}
      <div className="bg-bg2 border border-border rounded-xl p-4 mb-3">
        <h3 className="text-sm font-bold mb-3">{t.findWorker}</h3>
        {alert && <Alert type={alert.type} message={alert.msg} onDismiss={() => setAlert(null)} />}

        <div
          onClick={toggleCam}
          className={`bg-bg border-2 border-dashed rounded-lg p-5 text-center cursor-pointer mb-3 min-h-[80px] flex flex-col items-center justify-center transition-colors ${
            scanning ? "border-cyan border-solid bg-[#020e1a]" : "border-border"
          }`}
        >
          {!scanning && (
            <>
              <div className="text-2xl">{"\u{1F4F7}"}</div>
              <div className="text-sm font-bold mt-1 text-[#58a6ff]">{t.tapToScan}</div>
              <div className="text-xs text-text2 mt-0.5">{t.requiresCamera}</div>
            </>
          )}
          {scanning && (
            <>
              <div className="text-sm font-bold text-red2 mb-2">Tap to stop camera</div>
            </>
          )}
        </div>

        <div id="qr-reader" className={`mb-3 rounded-lg overflow-hidden ${scanning ? "" : "hidden"}`} />

        <div className="flex gap-2 mb-1">
          <input
            ref={searchRef}
            className="flex-1"
            placeholder="Worker ID or Name..."
            value={searchVal}
            onChange={(e) => liveSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") searchWorker(); }}
          />
          <button onClick={() => searchWorker()} className="bg-accent text-white px-5 py-2.5 rounded-lg font-bold text-sm min-h-[44px]">{t.search}</button>
        </div>

        {suggestions.length > 0 && (
          <div className="bg-bg border border-border rounded-lg mb-2 max-h-[200px] overflow-y-auto">
            {suggestions.map((w) => (
              <div
                key={w.id}
                className="p-3 border-b border-border2 last:border-b-0 flex items-center gap-2 cursor-pointer hover:bg-bg3 min-h-[44px]"
                onClick={() => { setSearchVal(w.id); setSuggestions([]); searchWorker(w.id); }}
              >
                <Avatar src={w.facePhoto} name={w.name} size={30} />
                <div>
                  <strong>{w.name}</strong>{" "}
                  <span className="text-xs text-text2">{w.id} - {w.job}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Card */}
      {currentWorker && (
        <div className="bg-[#0a1f0f] border-2 border-green rounded-xl p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={currentWorker.facePhoto} name={currentWorker.name} size={64} borderColor="border-green2" />
            <div className="flex-1">
              <div className="text-base font-extrabold text-green2">{currentWorker.name}</div>
              <div className="text-xs text-text2 mt-0.5">{currentWorker.job}</div>
            </div>
            <span className={`text-[0.69rem] px-2.5 py-0.5 rounded-full font-bold border ${
              currentWorker.status === "inside" ? "bg-[#0a2a4a] text-[#58a6ff] border-accent" : "bg-border2 text-text2 border-border"
            }`}>
              {currentWorker.status === "inside" ? t.inside : t.outside}
            </span>
          </div>

          <div className="bg-[#0a2a12] border border-green rounded-lg p-2.5 text-sm text-green2 mb-3">
            <strong>{t.visualCheck}</strong> {t.visualDesc}
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[
              { l: t.workerId, v: currentWorker.id },
              { l: t.contractorCompany, v: currentWorker.contractor },
              { l: t.jobTitle, v: currentWorker.job },
              { l: t.expires, v: currentWorker.expiryDisplay },
              { l: t.lastEntry, v: currentWorker.lastEntry || "--" },
              { l: t.mobile, v: currentWorker.phone || "--" },
              { l: t.nationality, v: currentWorker.nationality || "--" },
              { l: t.iqamaNumber, v: currentWorker.iqama },
            ].map((item) => (
              <div key={item.l} className="bg-bg rounded-lg p-2">
                <div className="text-[0.66rem] text-text2 uppercase tracking-wider mb-0.5">{item.l}</div>
                <div className="text-sm font-bold">{item.v}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#020e1a] border-2 border-accent rounded-lg p-3 text-center mb-3">
            <div className="text-xs text-[#58a6ff] font-bold uppercase mb-1">{t.irisOnFile}</div>
            <div className="w-[150px] h-[60px] bg-[#0d2035] rounded-md border border-dashed border-accent flex items-center justify-center text-3xl mx-auto mb-1">&#128065;</div>
            <div className="inline-block bg-[#0d2035] border border-[#2E86C1] rounded-md px-3 py-1 font-mono text-sm text-[#58a6ff]">{currentWorker.eyeId}</div>
          </div>

          <div className="bg-[#0d2035] border-2 border-[#58a6ff] rounded-lg p-3 text-center mb-3">
            <div className="text-xs text-[#58a6ff] font-bold uppercase mb-1">{t.verifyIqama}</div>
            <div className="text-2xl font-extrabold text-white tracking-[10px]">{currentWorker.digits.split("").join("  ")}</div>
          </div>

          {/* Telegram Verification */}
          {currentWorker.status !== "inside" && (
            <div className={`border-2 rounded-lg p-3 text-center mb-3 ${codeVerified ? "bg-[#0a2a12] border-green" : "bg-[#1a1a00] border-yellow"}`}>
              <div className={`text-xs font-bold uppercase mb-2 ${codeVerified ? "text-green2" : "text-yellow"}`}>
                {codeVerified ? t.codeVerified : t.telegramVerification}
              </div>
              {codeVerified ? (
                <div className="text-green2 text-2xl">&#10003;</div>
              ) : !telegramCode ? (
                <button
                  onClick={sendTelegramCode}
                  disabled={codeSending}
                  className="bg-[#0088cc] text-white px-5 py-2.5 rounded-lg font-bold text-sm min-h-[44px] disabled:opacity-50"
                >
                  {codeSending ? t.sending : t.sendTelegramCode}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-text2">{t.enterCode}</p>
                  <div className="flex gap-2 justify-center">
                    <input
                      className="w-32 text-center text-lg font-mono tracking-[8px]"
                      placeholder="----"
                      maxLength={4}
                      inputMode="numeric"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => { if (e.key === "Enter") verifyCode(); }}
                    />
                    <button onClick={verifyCode} className="bg-green text-white px-4 py-2 rounded-lg font-bold text-sm min-h-[44px]">{t.verify}</button>
                  </div>
                  <button onClick={sendTelegramCode} className="text-xs text-[#58a6ff] underline mt-1">{t.resendCode}</button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => doLog("in")}
              disabled={currentWorker.status !== "inside" && !codeVerified}
              className={`flex-1 py-3.5 rounded-lg font-bold text-base min-h-[48px] ${
                currentWorker.status !== "inside" && !codeVerified ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-green text-white"
              }`}
            >{t.logEntry}</button>
            <button onClick={() => doLog("out")} className="flex-1 bg-red text-white py-3.5 rounded-lg font-bold text-base min-h-[48px]">{t.logExit}</button>
          </div>
        </div>
      )}

      {/* Currently Inside */}
      <div className="bg-bg2 border border-border rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold">{t.currentlyInside}</h3>
          <span className="bg-green text-white rounded-full px-2.5 py-0.5 text-xs font-bold">{insideWorkers.length}</span>
        </div>
        {insideWorkers.length === 0 ? (
          <p className="text-center text-text2 py-5 text-sm">{t.noInside}</p>
        ) : (
          insideWorkers.map((w) => (
            <div key={w.id} className="bg-bg border border-border2 rounded-lg p-3 flex items-center gap-2 mb-1.5">
              <Avatar src={w.facePhoto} name={w.name} size={38} borderColor="border-green" />
              <div className="flex-1">
                <div className="font-bold text-sm">{w.name}</div>
                <div className="text-xs text-text2">{w.id} - {w.job}</div>
                <div className="text-xs text-green2">Entry: {w.lastEntry || "--"}</div>
              </div>
              <button onClick={() => manualExit(w.id)} className="bg-red text-white px-3 py-1.5 rounded-lg text-xs font-bold min-h-[36px]">{t.logExit}</button>
            </div>
          ))
        )}
      </div>

      {/* Today Log */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold">{t.todayGateLog}</h3>
          <button onClick={handleExportCSV} className="ml-auto bg-border2 border border-border text-text2 px-3 py-1 rounded-lg text-xs font-bold min-h-[36px]">{t.exportCSV}</button>
        </div>
        {todayLogs.length === 0 ? (
          <p className="text-center text-text2 py-5 text-sm">{t.noOps}</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto">
            {todayLogs.map((l, i) => (
              <div key={i} className={`bg-bg border border-border2 rounded-lg p-2.5 flex items-center gap-2 border-l-[3px] ${l.type === "in" ? "border-l-green" : "border-l-red2"}`}>
                <Avatar src={l.facePhoto} name={l.name} size={30} />
                <div className="flex-1">
                  <div className="font-bold text-sm">{l.name}</div>
                  <div className="text-[0.69rem] text-text2">{l.workerId} - {l.job}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-xs ${l.type === "in" ? "text-green2" : "text-red2"}`}>
                    {l.type === "in" ? "Entry" : "Exit"}
                  </div>
                  <div className="text-[0.68rem] text-text2">{l.time}{l.speed ? ` (${l.speed}s)` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
