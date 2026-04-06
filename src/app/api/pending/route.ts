import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM pending_workers WHERE status = 'pending' ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const w = await req.json();
    await sql`
      INSERT INTO pending_workers (id, name, iqama, contractor, job, phone, telegram, nationality,
        expiry_raw, expiry_display, digits, face_photo, eye_photo, eye_id, created_at, status)
      VALUES (${w.id}, ${w.name}, ${w.iqama}, ${w.contractor}, ${w.job}, ${w.phone}, ${w.telegram || ""},
        ${w.nationality}, ${w.expiryRaw}, ${w.expiryDisplay}, ${w.digits}, ${w.facePhoto}, ${w.eyePhoto},
        ${w.eyeId}, ${w.createdAt}, 'pending')
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, action } = await req.json();

    if (action === "approve") {
      // Move from pending to workers
      const rows = await sql`SELECT * FROM pending_workers WHERE id = ${id}`;
      if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const w = rows[0];

      await sql`
        INSERT INTO workers (id, name, iqama, contractor, job, phone, telegram, nationality,
          expiry_raw, expiry_display, digits, status, last_entry, face_photo, eye_photo, eye_id, created_at)
        VALUES (${w.id}, ${w.name}, ${w.iqama}, ${w.contractor}, ${w.job}, ${w.phone}, ${w.telegram},
          ${w.nationality}, ${w.expiry_raw}, ${w.expiry_display}, ${w.digits}, 'outside', NULL,
          ${w.face_photo}, ${w.eye_photo}, ${w.eye_id}, ${w.created_at})
      `;
      await sql`UPDATE pending_workers SET status = 'approved' WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      await sql`UPDATE pending_workers SET status = 'rejected' WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
