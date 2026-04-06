import { NextRequest, NextResponse } from "next/server";
import sql, { ensureDB } from "@/lib/db";
import { LogEntry } from "@/types";

function rowToLog(r: Record<string, unknown>): LogEntry {
  return {
    workerId: r.worker_id as string,
    name: r.name as string,
    job: r.job as string,
    contractor: r.contractor as string,
    nationality: r.nationality as string,
    facePhoto: r.face_photo as string | null,
    type: r.type as "in" | "out",
    time: r.time as string,
    date: r.date as string,
    speed: r.speed as number,
  };
}

export async function GET() {
  try {
    await ensureDB();
    const rows = await sql`SELECT * FROM logs ORDER BY id DESC`;
    return NextResponse.json(rows.map(rowToLog));
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDB();
    const l: LogEntry = await req.json();
    await sql`
      INSERT INTO logs (worker_id, name, job, contractor, nationality, face_photo, type, time, date, speed)
      VALUES (${l.workerId}, ${l.name}, ${l.job}, ${l.contractor}, ${l.nationality}, ${l.facePhoto}, ${l.type}, ${l.time}, ${l.date}, ${l.speed})
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}
