"use client";

import { useStore } from "@/lib/store";
import { translations } from "@/lib/i18n";

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDemo: () => void;
}

export default function Navbar({ activeTab, onTabChange, onDemo }: NavbarProps) {
  const { lang, setLang } = useStore();
  const t = translations[lang];

  const tabs = [
    { id: "contractor", label: t.contractor },
    { id: "security", label: t.security },
    { id: "stats", label: t.stats },
  ];

  return (
    <nav className="sticky top-0 z-50" style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}>
      {/* Top row: logo + controls */}
      <div className="flex items-center justify-between px-3 h-12">
        <div className="text-sm font-extrabold whitespace-nowrap" style={{ color: "#1f6feb" }}>
          {t.appName}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "#0d1117", border: "1px solid #30363d", color: "#8b949e" }}
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
          <button
            onClick={onDemo}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ background: "#9a6700" }}
          >
            {t.demo}
          </button>
        </div>
      </div>
      {/* Tab row */}
      <div className="flex px-2 pb-2 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors text-center"
            style={{
              background: activeTab === tab.id ? "#1f6feb" : "transparent",
              color: activeTab === tab.id ? "#ffffff" : "#8b949e",
              minHeight: "44px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
