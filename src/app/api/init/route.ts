import { NextResponse } from "next/server";
import { initDB } from "@/lib/db";

export async function POST() {
  try {
    await initDB();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DB init error:", e);
    return NextResponse.json({ error: "Failed to init DB" }, { status: 500 });
  }
}
