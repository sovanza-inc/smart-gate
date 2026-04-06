# Smart Gate

A Next.js-based smart gate management system for worker registration, security verification, and contractor management. Features QR code scanning, Telegram bot integration, and Neon PostgreSQL database.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Neon PostgreSQL
- **Notifications:** Telegram Bot API
- **Language:** TypeScript

## Features

- **Contractor Portal** - Register workers with ID, photo, and biometric data
- **Security Portal** - Verify workers via QR code scanning at entry/exit
- **Manager Portal** - Approve/reject pending worker registrations
- **Statistics Dashboard** - View entry/exit logs and speed analytics
- **Telegram Alerts** - Real-time notifications for gate events
- **Bilingual Support** - Arabic and English interface

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file:

```
DATABASE_URL=your_neon_database_url
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

## Manager Portal

Access the manager portal at `/manager`.

- **Password:** `smartgate2026`

## Deployment

Deployed on Vercel with automatic GitHub integration.
