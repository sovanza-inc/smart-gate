"use client";

import { useState, useEffect, useCallback } from "react";

const MANAGER_PASSWORD = "smartgate2026";

interface PendingWorker {
  id: string;
  name: string;
  iqama: string;
  contractor: string;
  job: string;
  phone: string;
  telegram: string;
  nationality: string;
  expiry_raw: string;
  expiry_display: string;
  digits: string;
  face_photo: string | null;
  eye_id: string;
  created_at: string;
  status: string;
}

export default function ManagerPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pending");
      const data = await res.json();
      setPending(Array.isArray(data) ? data : []);
    } catch {
      setPending([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) loadPending();
  }, [authed, loadPending]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(loadPending, 10000);
    return () => clearInterval(interval);
  }, [authed, loadPending]);

  function login() {
    if (password === MANAGER_PASSWORD) {
      setAuthed(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch("/api/pending", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setActionMsg({ type: "ok", msg: `Worker ${action === "approve" ? "approved" : "rejected"} successfully` });
        setPending((prev) => prev.filter((w) => w.id !== id));
      } else {
        setActionMsg({ type: "err", msg: "Action failed" });
      }
    } catch {
      setActionMsg({ type: "err", msg: "Network error" });
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a1929] flex items-center justify-center p-4">
        <div className="bg-[#0d2137] border border-[#1e3a5f] rounded-2xl p-8 max-w-[380px] w-full text-center">
          <div className="text-4xl mb-3">&#128272;</div>
          <h1 className="text-xl font-extrabold text-white mb-1">Manager Portal</h1>
          <p className="text-sm text-[#8b949e] mb-6">Smart Gate System</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") login(); }}
            placeholder="Enter password"
            className="w-full bg-[#0a1929] border border-[#1e3a5f] text-white rounded-lg px-4 py-3 text-center text-lg mb-3 outline-none focus:border-[#58a6ff]"
          />
          {error && <p className="text-[#f85149] text-sm mb-3">{error}</p>}
          <button
            onClick={login}
            className="w-full bg-[#1B4F72] text-white py-3 rounded-lg font-bold text-base hover:bg-[#2471a3] transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1929] p-4">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">&#128272;</div>
          <div>
            <h1 className="text-lg font-extrabold text-white">Manager Portal</h1>
            <p className="text-xs text-[#8b949e]">Approve or reject worker registrations</p>
          </div>
          <button
            onClick={loadPending}
            className="ml-auto bg-[#0d2137] border border-[#1e3a5f] text-[#8b949e] px-3 py-2 rounded-lg text-xs font-bold hover:border-[#58a6ff] hover:text-[#58a6ff]"
          >
            Refresh
          </button>
          <button
            onClick={() => setAuthed(false)}
            className="bg-[#2d0f0f] border border-[#f85149] text-[#f85149] px-3 py-2 rounded-lg text-xs font-bold"
          >
            Logout
          </button>
        </div>

        {/* Alert */}
        {actionMsg && (
          <div className={`rounded-lg p-3 mb-3 text-sm font-bold text-center ${
            actionMsg.type === "ok" ? "bg-[#0a2a12] border border-[#238636] text-[#3fb950]" : "bg-[#2d0f0f] border border-[#f85149] text-[#f85149]"
          }`}>
            {actionMsg.msg}
          </div>
        )}

        {/* Stats */}
        <div className="bg-[#0d2137] border border-[#1e3a5f] rounded-lg p-3 mb-4 flex items-center gap-3">
          <div className="text-3xl font-extrabold text-[#f0883e]">{pending.length}</div>
          <div className="text-sm text-[#8b949e]">Pending approvals</div>
          {loading && <div className="ml-auto text-xs text-[#58a6ff] animate-pulse">Loading...</div>}
        </div>

        {/* Pending List */}
        {pending.length === 0 ? (
          <div className="bg-[#0d2137] border border-[#1e3a5f] rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">&#9989;</div>
            <p className="text-[#8b949e] text-sm">No pending registrations</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((w) => (
              <div key={w.id} className="bg-[#0d2137] border border-[#1e3a5f] rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  {/* Face Photo */}
                  <div className="w-16 h-16 rounded-full border-2 border-[#1e3a5f] overflow-hidden flex-shrink-0 bg-[#0a1929]">
                    {w.face_photo ? (
                      <img src={w.face_photo} alt={w.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl text-[#58a6ff] font-bold">
                        {w.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-extrabold text-white">{w.name}</div>
                    <div className="text-xs text-[#8b949e] mt-0.5">{w.id} — {w.job}</div>
                    <div className="text-xs text-[#8b949e]">{w.contractor}</div>
                  </div>
                  <div className="bg-[#1a1000] border border-[#f0883e] text-[#f0883e] text-xs font-bold px-2 py-0.5 rounded-full">
                    Pending
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { l: "Iqama", v: w.iqama },
                    { l: "Nationality", v: w.nationality || "--" },
                    { l: "Phone", v: w.phone || "--" },
                    { l: "Telegram", v: w.telegram || "--" },
                    { l: "Expires", v: w.expiry_display },
                    { l: "Iris ID", v: w.eye_id },
                    { l: "Last 5 Digits", v: w.digits },
                    { l: "Submitted", v: w.created_at },
                  ].map((item) => (
                    <div key={item.l} className="bg-[#0a1929] rounded-lg p-2">
                      <div className="text-[0.6rem] text-[#8b949e] uppercase tracking-wider">{item.l}</div>
                      <div className="text-xs font-bold text-white mt-0.5 break-all">{item.v}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(w.id, "approve")}
                    className="flex-1 bg-[#238636] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#2ea043] transition-colors"
                  >
                    &#10003; Approve
                  </button>
                  <button
                    onClick={() => handleAction(w.id, "reject")}
                    className="flex-1 bg-[#da3633] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#f85149] transition-colors"
                  >
                    &#10007; Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
