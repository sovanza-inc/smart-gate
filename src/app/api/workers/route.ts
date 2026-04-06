import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { Worker } from "@/types";

function rowToWorker(r: Record<string, unknown>): Worker {
  return {
    id: r.id as string,
    name: r.name as string,
    iqama: r.iqama as string,
    contractor: r.contractor as string,
    job: r.job as string,
    phone: r.phone as string,
    telegram: r.telegram as string,
    nationality: r.nationality as string,
    expiryRaw: r.expiry_raw as string,
    expiryDisplay: r.expiry_display as string,
    digits: r.digits as string,
    status: r.status as "inside" | "outside",
    lastEntry: r.last_entry as string | null,
    facePhoto: r.face_photo as string | null,
    eyePhoto: r.eye_photo as string | null,
    eyeId: r.eye_id as string,
    createdAt: r.created_at as string,
  };
}

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM workers ORDER BY created_at DESC`;
    return NextResponse.json(rows.map(rowToWorker));
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const w: Worker = await req.json();
    await sql`
      INSERT INTO workers (id, name, iqama, contractor, job, phone, telegram, nationality,
        expiry_raw, expiry_display, digits, status, last_entry, face_photo, eye_photo, eye_id, created_at)
      VALUES (${w.id}, ${w.name}, ${w.iqama}, ${w.contractor}, ${w.job}, ${w.phone}, ${w.telegram || ""}, ${w.nationality},
        ${w.expiryRaw}, ${w.expiryDisplay}, ${w.digits}, ${w.status}, ${w.lastEntry}, ${w.facePhoto}, ${w.eyePhoto}, ${w.eyeId}, ${w.createdAt})
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create worker" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const w: Worker = await req.json();
    await sql`
      UPDATE workers SET
        status = ${w.status},
        last_entry = ${w.lastEntry}
      WHERE id = ${w.id}
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update worker" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM workers WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete worker" }, { status: 500 });
  }
}
