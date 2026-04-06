import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const { chatId, code, workerName } = await req.json();

    if (!chatId || !code) {
      return NextResponse.json({ error: "Missing chatId or code" }, { status: 400 });
    }

    if (!BOT_TOKEN) {
      return NextResponse.json({ error: "Telegram bot token not configured" }, { status: 500 });
    }

    const message =
      `🔐 *Smart Gate Verification*\n\n` +
      `Worker: *${workerName}*\n` +
      `Your entry code: \`${code}\`\n\n` +
      `Show this code to the security guard to enter the gate.\n` +
      `_This code expires in 5 minutes._`;

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.description || "Failed to send message" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send Telegram message" }, { status: 500 });
  }
}
