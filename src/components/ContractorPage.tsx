"use client";

import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import { Worker } from "@/types";
import {
  generateId, initials, formatDate, generateIrisId,
  makeFaceCanvas, randomColor, isExpired, daysLeft,
} from "@/lib/utils";
import { JOB_OPTIONS, NATIONALITIES } from "@/lib/demo-data";
import Avatar from "./Avatar";
import Alert from "./Alert";
import QRModal from "./QRModal";

export default function ContractorPage() {
  const { workers, setWorkers, lang } = useStore();
  const t = translations[lang];

  const [step, setStep] = useState(1);
  const [alert, setAlert] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [faceData, setFaceData] = useState<string | null>(null);
  const [eyeId, setEyeId] = useState<string | null>(null);
  const [eyeScanning, setEyeScanning] = useState(false);
  const [qrWorker, setQrWorker] = useState<Worker | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const [formData, setFormData] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return { name: "", iqama: "", contractor: "", job: "", nationality: "", expiry: d.toISOString().split("T")[0], phone: "", telegram: "" };
  });
  const updateField = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const faceVideoRef = useRef<HTMLVideoElement>(null);
  const faceStreamRef = useRef<MediaStream | null>(null);

  const defaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };

  function goStep(n: number) {
    if (n >= 2) {
      if (!formData.name || !formData.iqama || !formData.contractor) { setAlert({ type: "err", msg: t.fillRequired }); return; }
      if (formData.iqama.length < 8 || !/^\d+$/.test(formData.iqama)) { setAlert({ type: "err", msg: t.iqamaInvalid }); return; }
      if (!formData.expiry) { setAlert({ type: "err", msg: t.selectExpiry }); return; }
    }
    setAlert(null);
    setStep(n);
  }

  async function startFaceCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      faceStreamRef.current = stream;
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
        faceVideoRef.current.style.display = "block";
      }
      setCameraActive(true);
    } catch {
      setAlert({ type: "err", msg: "Camera blocked - tap Simulate" });
    }
  }

  function captureFace() {
    const v = faceVideoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    setFaceData(c.toDataURL("image/jpeg", 0.8));
    stopFaceCam();
  }

  function stopFaceCam() {
    faceStreamRef.current?.getTracks().forEach((t) => t.stop());
    faceStreamRef.current = null;
    if (faceVideoRef.current) faceVideoRef.current.style.display = "none";
    setCameraActive(false);
  }

  function simFace() {
    setFaceData(makeFaceCanvas(initials(formData.name || "W"), randomColor()));
  }

  function simEye() {
    setEyeScanning(true);
    setTimeout(() => {
      setEyeId(generateIrisId());
      setEyeScanning(false);
    }, 2000);
  }

  async function register() {
    if (!eyeId) { setAlert({ type: "err", msg: t.completeEye }); return; }
    if (!formData.expiry) { setAlert({ type: "err", msg: t.selectExpiry }); return; }

    const exp = new Date(formData.expiry + "T23:59:59");
    const w: Worker = {
      id: generateId(),
      name: formData.name, iqama: formData.iqama, contractor: formData.contractor,
      job: formData.job || "General Laborer", phone: formData.phone,
      telegram: formData.telegram, nationality: formData.nationality || "Not specified",
      expiryRaw: exp.toISOString(),
      expiryDisplay: formatDate(exp.toISOString()),
      digits: formData.iqama.slice(-5),
      status: "outside",
      lastEntry: null,
      facePhoto: faceData || makeFaceCanvas(initials(formData.name), randomColor()),
      eyePhoto: null,
      eyeId,
      createdAt: new Date().toLocaleString("en-US"),
    };

    // Submit to pending approval
    try {
      const res = await fetch("/api/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(w),
      });
      if (!res.ok) throw new Error();
    } catch {
      setAlert({ type: "err", msg: "Failed to submit registration" });
      return;
    }

    setQrWorker(w);
    setStep(4);
  }

  function finishRegistration() {
    const d = new Date(); d.setDate(d.getDate() + 7);
    setFormData({ name: "", iqama: "", contractor: "", job: "", nationality: "", expiry: d.toISOString().split("T")[0], phone: "", telegram: "" });
    setFaceData(null);
    setEyeId(null);
    setQrWorker(null);
    setStep(1);
  }

  const expiredCount = workers.filter(isExpired).length;
  const expiringCount = workers.filter((w) => { const dl = daysLeft(w); return dl >= 0 && dl <= 3; }).length;

  return (
    <div className="p-4 max-w-[900px] mx-auto">
      {/* Storage Status */}
      <div className="bg-[#0d2035] border border-accent rounded-lg p-2 px-3 text-sm text-[#58a6ff] mb-3 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${typeof window !== "undefined" && navigator.onLine ? "bg-green2" : "bg-red2"}`} />
        Storage connected
      </div>

      {/* Steps */}
      <div className="flex rounded-lg overflow-hidden border border-border mb-4">
        {[
          { n: 1, label: t.stepInfo },
          { n: 2, label: t.stepFace },
          { n: 3, label: t.stepEye },
          { n: 4, label: t.stepQR },
        ].map((s) => (
          <div
            key={s.n}
            className={`flex-1 py-2.5 text-center text-xs font-semibold border-r border-border last:border-r-0 ${
              s.n < step ? "bg-[#0f2a1a] text-green2" : s.n === step ? "bg-accent text-white" : "bg-bg3 text-text2"
            }`}
          >
            <span className="block text-sm">{s.n}</span>
            {s.label}
          </div>
        ))}
      </div>

      {alert && <Alert type={alert.type} message={alert.msg} onDismiss={() => setAlert(null)} />}

      {/* Step 1: Info */}
      {step === 1 && (
        <div className="bg-bg2 border border-border rounded-xl p-4 mb-3">
          <h3 className="text-sm font-bold mb-3">{t.workerInfo}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-text2 font-bold uppercase block mb-1">{t.fullName}</label><input value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Mohammed Ahmed" /></div>
            <div><label className="text-xs text-text2 font-bold uppercase block mb-1">{t.iqamaNumber}</label><input value={formData.iqama} onChange={(e) => updateField("iqama", e.target.value)} placeholder="2345678901" maxLength={10} inputMode="numeric" /></div>
            <div><label className="text-xs text-text2 font-bold uppercase block mb-1">{t.contractorCompany}</label><input value={formData.contractor} onChange={(e) => updateField("contractor", e.target.value)} placeholder="Al-Rashid Construction" /></div>
            <div>
              <label className="text-xs text-text2 font-bold uppercase block mb-1">{t.jobTitle}</label>
              <select value={formData.job} onChange={(e) => updateField("job", e.target.value)}>
                <option value="">-- Select --</option>
                {JOB_OPTIONS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.jobs.map((j) => <option key={j}>{j}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text2 font-bold uppercase block mb-1">{t.nationality}</label>
              <select value={formData.nationality} onChange={(e) => updateField("nationality", e.target.value)}>
                <option value="">-- Select --</option>
                {NATIONALITIES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-text2 font-bold uppercase block mb-1">{t.cardValidUntil}</label><input value={formData.expiry} onChange={(e) => updateField("expiry", e.target.value)} type="date" min={new Date().toISOString().split("T")[0]} /></div>
            <div><label className="text-xs text-text2 font-bold uppercase block mb-1">{t.mobile}</label><input value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="05xxxxxxxx" maxLength={10} inputMode="numeric" /></div>
            <div><label className="text-xs text-text2 font-bold uppercase block mb-1">{t.telegramId}</label><input value={formData.telegram} onChange={(e) => updateField("telegram", e.target.value)} placeholder="Telegram Chat ID" inputMode="numeric" /></div>
          </div>
          <button onClick={() => goStep(2)} className="w-full mt-4 bg-accent text-white rounded-lg py-3 font-bold text-sm min-h-[48px]">
            {t.nextFace}
          </button>
        </div>
      )}

      {/* Step 2: Face */}
      {step === 2 && (
        <div className="bg-bg2 border border-border rounded-xl p-4 mb-3">
          <h3 className="text-sm font-bold mb-3">{t.facePhoto}</h3>
          <div className={`bg-bg border-2 ${faceData ? "border-green border-solid" : "border-border border-dashed"} rounded-xl p-5 text-center`}>
            <video ref={faceVideoRef} autoPlay playsInline className="w-full rounded-lg max-h-[240px] object-cover border-2 border-cyan mb-2" style={{ display: "none" }} />
            {!faceData ? (
              <>
                {!cameraActive && <div className="text-4xl mb-2">&#128247;</div>}
                {!cameraActive && <p className="text-sm text-text2 mb-3">{t.captureDesc}</p>}
                {!cameraActive && (
                  <div className="flex gap-2 justify-center">
                    <button onClick={startFaceCam} className="bg-accent text-white px-4 py-2.5 rounded-lg font-bold text-sm min-h-[44px]">{t.camera}</button>
                    <button onClick={simFace} className="bg-orange text-white px-4 py-2.5 rounded-lg font-bold text-sm min-h-[44px]">{t.simulate}</button>
                  </div>
                )}
                {cameraActive && (
                  <div className="flex gap-2 justify-center mt-2">
                    <button onClick={captureFace} className="bg-green text-white px-4 py-2.5 rounded-lg font-bold text-sm min-h-[44px]">{t.capture}</button>
                    <button onClick={() => { stopFaceCam(); }} className="bg-border2 border border-border text-text2 px-4 py-2.5 rounded-lg text-sm min-h-[44px]">{t.cancel}</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <img src={faceData} alt="Face" className="w-24 h-24 rounded-full object-cover border-3 border-green mx-auto mb-2" />
                <p className="text-green2 text-sm mb-2">{t.photoCaptured}</p>
                <button onClick={() => setFaceData(null)} className="bg-border2 border border-border text-text2 px-3 py-1.5 rounded-lg text-xs">{t.retake}</button>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setStep(1)} className="bg-border2 border border-border text-text2 px-4 py-2.5 rounded-lg font-bold text-sm min-h-[48px]">{t.back}</button>
            <button onClick={() => goStep(3)} className="flex-1 bg-accent text-white rounded-lg py-2.5 font-bold text-sm min-h-[48px]">{t.nextEye}</button>
          </div>
        </div>
      )}

      {/* Step 3: Eye */}
      {step === 3 && (
        <div className="bg-bg2 border border-border rounded-xl p-4 mb-3">
          <h3 className="text-sm font-bold mb-3">{t.eyeBiometric}</h3>
          <div className={`bg-bg border-2 ${eyeId ? "border-green border-solid" : "border-border border-dashed"} rounded-xl p-5 text-center`}>
            {!eyeId && !eyeScanning && (
              <>
                <div className="text-4xl mb-2">&#128065;</div>
                <p className="text-sm text-text2 mb-3">{t.eyeDesc}</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={simEye} className="bg-accent text-white px-4 py-2.5 rounded-lg font-bold text-sm min-h-[44px]">{t.irisScan}</button>
                  <button onClick={simEye} className="bg-orange text-white px-4 py-2.5 rounded-lg font-bold text-sm min-h-[44px]">{t.simulate}</button>
                </div>
              </>
            )}
            {eyeScanning && (
              <div className="py-4">
                <div className="w-17 h-17 border-3 border-cyan rounded-full mx-auto flex items-center justify-center text-3xl animate-pulse-ring">&#128065;</div>
                <div className="w-3/4 h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent mx-auto mt-2 animate-scan-bar" />
                <p className="text-cyan text-sm font-semibold mt-2">{t.scanningIris}</p>
              </div>
            )}
            {eyeId && !eyeScanning && (
              <>
                <div className="w-40 h-[70px] bg-[#0d2035] rounded-lg border-3 border-[#2E86C1] flex items-center justify-center text-3xl mx-auto mb-2">&#128065;</div>
                <div className="inline-block bg-[#0d2035] border border-[#2E86C1] rounded-md px-3 py-1 font-mono text-sm text-[#58a6ff] mt-1">{eyeId}</div>
                <p className="text-green2 text-sm mt-2 mb-2">{t.irisRecorded}</p>
                <button onClick={() => setEyeId(null)} className="bg-border2 border border-border text-text2 px-3 py-1.5 rounded-lg text-xs">{t.rescan}</button>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setStep(2)} className="bg-border2 border border-border text-text2 px-4 py-2.5 rounded-lg font-bold text-sm min-h-[48px]">{t.back}</button>
            <button onClick={register} className="flex-1 bg-green text-white rounded-lg py-2.5 font-bold text-sm min-h-[48px]">{t.registerQR}</button>
          </div>
        </div>
      )}

      {/* Step 4: Submitted */}
      {step === 4 && qrWorker && (
        <div className="bg-[#1a1000] border-2 border-[#f0883e] rounded-xl p-5 mb-3 text-center">
          <div className="text-[#f0883e] text-3xl mb-2">&#9203;</div>
          <h3 className="text-lg font-extrabold text-[#f0883e] mb-1">{t.pendingApproval}</h3>
          <p className="text-sm text-text2 mb-4">{qrWorker.name} — {qrWorker.id}</p>
          <div className="bg-[#0d2035] border border-[#1e3a5f] rounded-lg p-3 mb-3">
            <p className="text-sm text-[#8b949e]">{t.pendingDesc}</p>
          </div>
          <div className="flex justify-center mb-3">
            <QRCodeCanvas value={qrWorker.id} size={160} />
          </div>
          <div className="text-xs text-[#8b949e] mb-3">{t.qrActiveAfterApproval}</div>
          <button onClick={finishRegistration} className="w-full bg-accent text-white py-3 rounded-lg font-bold text-sm min-h-[48px]">{t.registerAnother}</button>
        </div>
      )}

      {/* Expiry Alerts */}
      {expiredCount > 0 && (
        <div className="bg-[#1a1000] border border-orange rounded-lg p-2 px-3 text-sm text-yellow mb-2 flex items-center gap-2">
          &#9888; <strong>{expiredCount}</strong> {t.expired} cards
        </div>
      )}
      {expiringCount > 0 && (
        <div className="bg-[#0d2035] border border-accent rounded-lg p-2 px-3 text-sm text-[#58a6ff] mb-2 flex items-center gap-2">
          &#9200; <strong>{expiringCount}</strong> cards expiring within 3 days
        </div>
      )}

      {/* Workers List */}
      <div className="bg-bg2 border border-border rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold">{t.registeredWorkers}</h3>
          <span className="bg-accent text-white rounded-full px-2.5 py-0.5 text-xs font-bold">{workers.length}</span>
        </div>
        {workers.length === 0 ? (
          <p className="text-center text-text2 py-5 text-sm">{t.noWorkers}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {[...workers].reverse().map((w) => {
              const exp = isExpired(w);
              const dl = daysLeft(w);
              return (
                <div key={w.id} className="bg-bg border border-border2 rounded-lg p-3 flex items-center gap-2 flex-wrap">
                  <Avatar src={w.facePhoto} name={w.name} />
                  <div className="flex-1 min-w-[80px]">
                    <div className="font-bold text-sm">{w.name}</div>
                    <div className="text-xs text-text2 mt-0.5">{w.id} - {w.job}{w.nationality ? ` - ${w.nationality}` : ""}</div>
                    <div className="text-xs text-text2">{w.contractor} | Exp: {w.expiryDisplay}</div>
                  </div>
                  <span className={`text-[0.69rem] px-2 py-0.5 rounded-full font-bold border ${
                    exp ? "bg-[#2d0f0f] text-red2 border-red" : dl <= 3 ? "bg-[#1a1000] text-yellow border-orange" : "bg-[#0a3d1a] text-green2 border-green"
                  }`}>
                    {exp ? t.expired : dl <= 3 ? `${dl}${t.daysLeft}` : t.active}
                  </span>
                  <button onClick={() => { setQrWorker(w); setShowQrModal(true); }} className="bg-border2 border border-border text-text2 px-2.5 py-1 rounded-lg text-xs min-h-[36px]">QR</button>
                  <button onClick={() => { if (confirm("Delete?")) setWorkers((prev) => prev.filter((x) => x.id !== w.id)); }} className="bg-red text-white px-2.5 py-1 rounded-lg text-xs min-h-[36px]">Del</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Contractor Summary */}
      <div className="bg-bg2 border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold mb-3">{t.contractorSummary}</h3>
        {workers.length === 0 ? (
          <p className="text-center text-text2 py-5 text-sm">{t.noData}</p>
        ) : (
          (() => {
            const map: Record<string, { total: number; inside: number; outside: number; expired: number }> = {};
            workers.forEach((w) => {
              if (!map[w.contractor]) map[w.contractor] = { total: 0, inside: 0, outside: 0, expired: 0 };
              map[w.contractor].total++;
              if (isExpired(w)) map[w.contractor].expired++;
              else if (w.status === "inside") map[w.contractor].inside++;
              else map[w.contractor].outside++;
            });
            return Object.entries(map).map(([name, s]) => (
              <div key={name} className="bg-bg border border-border2 rounded-lg p-3 mb-2">
                <div className="font-bold text-sm mb-2">{name}</div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { n: s.total, l: t.total, c: "#58a6ff" },
                    { n: s.inside, l: t.inside, c: "var(--color-green2)" },
                    { n: s.outside, l: t.outside, c: "var(--color-text2)" },
                    { n: s.expired, l: t.expired, c: "var(--color-red2)" },
                  ].map((item) => (
                    <div key={item.l} className="bg-bg2 rounded-lg px-3 py-1 text-center flex-1 min-w-[55px]">
                      <div className="text-base font-extrabold" style={{ color: item.c }}>{item.n}</div>
                      <div className="text-[0.65rem] text-text2">{item.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()
        )}
      </div>

      {showQrModal && qrWorker && <QRModal worker={qrWorker} onClose={() => setShowQrModal(false)} />}
    </div>
  );
}
