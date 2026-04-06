"use client";

import { useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Worker } from "@/types";
import { useStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import Avatar from "./Avatar";

interface QRModalProps {
  worker: Worker;
  onClose: () => void;
}

export default function QRModal({ worker: w, onClose }: QRModalProps) {
  const { lang } = useStore();
  const t = translations[lang];
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function downloadQR() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const out = document.createElement("canvas");
    out.width = 340;
    out.height = 460;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 340, 460);
    ctx.fillStyle = "#1B4F72";
    ctx.fillRect(0, 0, 340, 70);
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Smart Gate System", 170, 22);
    ctx.font = "bold 14px Arial";
    ctx.fillText(w.name, 170, 42);
    ctx.font = "11px Arial";
    ctx.fillText(`${w.id} - ${w.job} - ${w.nationality || ""}`, 170, 58);
    ctx.drawImage(canvas, 80, 80, 180, 180);
    ctx.fillStyle = "#0a3d1a";
    ctx.fillRect(20, 270, 300, 70);
    ctx.strokeStyle = "#238636";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 270, 300, 70);
    ctx.fillStyle = "#3fb950";
    ctx.font = "bold 11px Arial";
    ctx.fillText("Last 5 Iqama Digits - Show at Gate", 170, 290);
    ctx.font = "bold 28px monospace";
    ctx.fillText(w.digits.split("").join("  "), 170, 320);
    ctx.fillStyle = "#444";
    ctx.font = "11px Arial";
    ctx.fillText(`Valid: ${w.expiryDisplay}`, 170, 365);
    ctx.fillText(w.contractor, 170, 382);
    if (w.eyeId) ctx.fillText(`Iris: ${w.eyeId}`, 170, 399);
    ctx.fillStyle = "#1B4F72";
    ctx.font = "bold 9px Arial";
    ctx.fillText("Saudi Aramco - Security Gate Pass", 170, 435);

    const a = document.createElement("a");
    a.download = `SmartGate_${w.id}.png`;
    a.href = out.toDataURL("image/png");
    a.click();
  }

  function printBadge() {
    const canvas = qrRef.current?.querySelector("canvas");
    const qrImg = canvas?.toDataURL("image/png") || "";
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`<html><head><title>Badge - ${w.name}</title><style>
      body{font-family:Arial,sans-serif;margin:0;padding:20px;text-align:center;}
      .badge-card{border:2px solid #1B4F72;border-radius:12px;padding:20px;max-width:320px;margin:0 auto;}
      .header{background:#1B4F72;color:white;padding:10px;border-radius:8px 8px 0 0;margin:-20px -20px 15px;font-size:14px;font-weight:bold;}
      .face{width:80px;height:80px;border-radius:50%;border:3px solid #1B4F72;object-fit:cover;margin:0 auto 10px;display:block;}
      .name{font-size:18px;font-weight:bold;margin-bottom:4px;}
      .meta{font-size:12px;color:#666;margin-bottom:3px;}
      .digits{background:#e8f5e9;border:2px solid #2e7d32;border-radius:8px;padding:10px;margin:10px 0;font-size:24px;font-weight:bold;letter-spacing:8px;font-family:monospace;}
      .info{font-size:11px;color:#888;margin-top:8px;}
    </style></head><body>
      <div class="badge-card">
        <div class="header">Smart Gate System<br>Security Gate Pass</div>
        ${w.facePhoto ? `<img src="${w.facePhoto}" class="face">` : ""}
        <div class="name">${w.name}</div>
        <div class="meta">${w.id} | ${w.job}</div>
        <div class="meta">${w.contractor}</div>
        <div class="meta">${w.nationality || ""}</div>
        ${qrImg ? `<img src="${qrImg}" class="qr" width="160" height="160" style="margin:12px auto;">` : ""}
        <div class="digits">${w.digits.split("").join(" ")}</div>
        <div class="info">Valid until: ${w.expiryDisplay}</div>
        <div class="info">Iris: ${w.eyeId}</div>
      </div>
      <script>setTimeout(function(){window.print();},500);<\/script>
    </body></html>`);
    win.document.close();
  }

  function sendWA() {
    const phone = w.phone ? "966" + w.phone.slice(1) : "";
    const msg = `*Smart Gate System - Worker Pass*\n\nHello ${w.name},\n\nWorker ID: ${w.id}\nJob: ${w.job}\nContractor: ${w.contractor}\nNationality: ${w.nationality || "--"}\nLast 5 Iqama digits: ${w.digits.split("").join(" ")}\nIris ID: ${w.eyeId}\nValid until: ${w.expiryDisplay}\n\nShow your QR code at the security gate.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[400] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-bg2 border border-border rounded-2xl p-5 max-w-[360px] w-full text-center max-h-[92vh] overflow-y-auto">
        <Avatar src={w.facePhoto} name={w.name} size={58} borderColor="border-green" className="mx-auto mb-2" />
        <div className="text-base font-extrabold">{w.name}</div>
        <div className="text-xs text-text2 mb-3">{w.id} - {w.job} - {w.contractor}</div>

        <div ref={qrRef} className="flex justify-center my-3">
          <QRCodeCanvas value={w.id} size={180} />
        </div>

        <div className="bg-[#0a3d1a] border border-green rounded-lg p-3 my-2">
          <div className="text-xs text-text2 mb-1">{t.digitsLabel}</div>
          <div className="text-xl font-extrabold text-green2 tracking-[7px] font-mono">{w.digits.split("").join(" ")}</div>
        </div>

        <div className="text-xs text-yellow mb-2">{t.validUntil}: {w.expiryDisplay}</div>

        <div className="flex gap-2 mt-3 flex-wrap">
          <button onClick={onClose} className="flex-1 bg-border2 border border-border text-text2 py-2.5 rounded-lg font-bold text-sm min-h-[44px]">{t.close}</button>
          <button onClick={downloadQR} className="flex-1 bg-accent text-white py-2.5 rounded-lg font-bold text-sm min-h-[44px]">{t.saveQR}</button>
          <button onClick={printBadge} className="flex-1 bg-green text-white py-2.5 rounded-lg font-bold text-sm min-h-[44px]">{t.printBadge}</button>
          <button onClick={sendWA} className="flex-1 bg-green text-white py-2.5 rounded-lg font-bold text-sm min-h-[44px]">WhatsApp</button>
        </div>
      </div>
    </div>
  );
}
