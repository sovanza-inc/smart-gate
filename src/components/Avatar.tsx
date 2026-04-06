"use client";

import { initials, randomColor } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  borderColor?: string;
  className?: string;
}

export default function Avatar({ src, name, size = 44, borderColor = "border-border", className = "" }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border-2 ${borderColor} shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-extrabold text-white shrink-0 ${className}`}
      style={{ width: size, height: size, background: randomColor(), fontSize: size * 0.35 }}
    >
      {initials(name)}
    </div>
  );
}
