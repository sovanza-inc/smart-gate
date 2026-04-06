"use client";

import { useEffect, useState } from "react";

interface AlertProps {
  type: "ok" | "err" | "info" | "warn";
  message: string;
  onDismiss?: () => void;
}

const styles = {
  ok: "bg-[#0a1f0f] border-green text-green2",
  err: "bg-[#2d0f0f] border-red text-red2",
  info: "bg-[#0d2035] border-accent text-[#58a6ff]",
  warn: "bg-[#1a1000] border-orange text-yellow",
};

export default function Alert({ type, message, onDismiss }: AlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (type !== "err" && onDismiss) {
      const t = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [type, onDismiss]);

  if (!visible || !message) return null;

  return (
    <div className={`rounded-lg p-3 text-sm mb-3 border ${styles[type]}`}>
      {message}
    </div>
  );
}
