import { NextRequest, NextResponse } from "next/server";
import sql, { ensureDB } from "@/lib/db";

export async function GET() {
  try {
    await ensureDB();
    const rows = await sql`SELECT value FROM speeds ORDER BY id DESC`;
    return NextResponse.json(rows.map((r) => r.value as number));
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDB();
    const { value } = await req.json();
    await sql`INSERT INTO speeds (value) VALUES (${value})`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add speed" }, { status: 500 });
  }
}
