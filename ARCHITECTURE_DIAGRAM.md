# Telegram Bot Architecture: Webhook vs Polling

## Current Architecture (Webhook Mode ✅)

```
┌──────────────────────────────────────────────────────────────┐
│                      Telegram Servers                        │
│                                                              │
│  User sends: /status                                        │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ Instant webhook POST
                 │ (when user sends message)
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│            Vercel Serverless Function                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ POST /bot/webhook                                      │ │
│  │                                                        │ │
│  │ handleUpdate(req.body)                               │ │
│  │   ├─ Check: Is command? (/start, /status, etc)      │ │
│  │   ├─ Check: Is text message? (AI processing)        │ │
│  │   ├─ Check: Is photo? (Receipt scanning)            │ │
│  │   └─ Process: Query database, run handlers          │ │
│  └────────────────────────────────────────────────────────┘ │
│         │                                              │     │
│         ├─ Query PostgreSQL Database                  │     │
│         │  (user info, group info, member data)       │     │
│         │                                              │     │
│         └─ Generate bot response                       │     │
│                                                        │     │
│  return res.status(200).json({ ok: true })            │     │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Response sent to Telegram
                 │
                 ▼
        ┌───────────────────┐
        │  Telegram Servers │
        │                   │
        │  Send response to │
        │  user via bot     │
        └───────────────────┘
                 │
                 │
                 ▼
        ┌────────────────────┐
        │  Telegram User     │
        │  Receives response │
        └────────────────────┘

Total Time: <100ms ⚡
Lambda Executions: Only when message arrives
Cost: Very Low ✅
```

## Old Architecture (Polling - Not Used Anymore)

```
┌──────────────────────────────────────────────────────────────┐
│            Vercel Serverless Function                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ bot.launch()  // Polling loop                         │ │
│  │                                                        │ │
│  │ Every 2-3 seconds:                                   │ │
│  │   ├─ Ask Telegram: "Any updates for me?"            │ │
│  │   ├─ If yes: Process update                         │ │
│  │   └─ If no: Do nothing, wait 2 seconds              │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬───────────────────────────────────────────┘
                 │
                 │ Polling request every 2-3 seconds
                 │ (even if no messages!)
                 │
                 ▼
        ┌───────────────────┐
        │ Telegram Servers  │
        │                   │
        │ Return updates or │
        │ empty response    │
        └───────────────────┘

Total Time: 2-5 seconds 🐢
Lambda Executions: Continuous (not good for serverless)
Cost: Higher ❌
Problem: Serverless functions not designed for this!
```

## Request/Response Flow - Webhook Mode

### Success Case

```
Timeline:
t=0ms      User sends: "/status"
           ↓
t=1ms      Telegram detects message
           ↓
t=2ms      POST /bot/webhook
           Body: { update_id, message, ... }
           ↓
t=3ms      Server receives request
           ├─ Parse update
           ├─ Query database for group info
           ├─ Count members and trips
           ↓
t=50ms     Generate response: "📊 Group Status..."
           ↓
t=51ms     ctx.reply(summary)
           ├─ Send to Telegram API
           ├─ Return 200 OK immediately
           ↓
t=80ms     Telegram receives "200 OK"
           ├─ Sends message to user
           ↓
t=90ms     User receives bot response ✅

Total Latency: ~90ms
Lambda Cold Start: ~40-50ms (included above)
Lambda Duration: ~80ms
Lambda Cost: ~$0.0000001 per request
```

### Error Case

```
t=0ms      Error happens during processing
           ├─ Database connection fails
           ├─ Or API error
           ↓
t=80ms     catch (err)
           ├─ Log error
           ├─ return res.status(200).json({ ok: true, error: msg })
           ↓
t=85ms     Send 200 OK to Telegram IMMEDIATELY
           (prevents Telegram from retrying)
           ↓
t=90ms     Telegram: "200 OK received"
           ├─ Does NOT retry
           ├─ Does NOT spam with retries
           ↓
           User still gets response (from cache or error message)

Key Point: Always return 200 OK to prevent Telegram retries!
This is handled automatically in the code.
```

## Database Interactions

```
Bot Request
    │
    ├─ Middleware: Get user info
    │  └─ SELECT id, usernm FROM user_infm WHERE telegram_id = ?
    │
    ├─ Handler: Process command/message
    │  ├─ SELECT ... FROM grp_infm WHERE telegram_chat_id = ?
    │  ├─ SELECT ... FROM member_infm WHERE group_id = ?
    │  ├─ SELECT ... FROM trp_infm WHERE group_id = ?
    │  └─ INSERT/UPDATE as needed
    │
    └─ Return response
       └─ Reply to Telegram user
```

## Webhook Setup Diagram

```
1. Server Starts
   ↓
2. initTelegramBot(TOKEN) called
   ├─ new Telegraf(TOKEN)
   └─ Register handlers (commands, text, photos)
   ↓
3. setupWebhookOnStart() called
   ├─ if TELEGRAM_WEBHOOK_URL is set:
   │  ├─ POST to Telegram API
   │  ├─ Call: setWebhook(webhookUrl)
   │  └─ Return: { ok: true }
   └─ else: Skip (webhook not configured)
   ↓
4. Telegram Updates webhook list:
   ├─ Old webhooks removed
   └─ New webhook registered
   ↓
5. Server Ready
   ├─ Listening on port 9000 (or Vercel)
   └─ Waiting for webhooks

From this point on:
When user messages → Telegram → POST to /bot/webhook → Bot handles
```

## Environment Variables & URLs

```
┌─────────────────────────────────────────────────────────┐
│ Vercel Environment                                      │
├─────────────────────────────────────────────────────────┤
│ TELEGRAM_BOT_TOKEN_NEW                                  │
│   ├─ Your bot's secret token from BotFather            │
│   └─ Used to authenticate with Telegram                │
│                                                         │
│ TELEGRAM_WEBHOOK_URL (NEW!)                            │
│   ├─ Example: https://tinynotie-api.vercel.app/bot/webhook
│   ├─ Must be HTTPS (Telegram requirement)              │
│   ├─ Must be publicly accessible                       │
│   └─ Must be registered with Telegram                  │
│                                                         │
│ DATABASE_URL                                            │
│   ├─ PostgreSQL connection string                      │
│   └─ Used for all data queries                         │
└─────────────────────────────────────────────────────────┘
        │
        │ SERVER STARTUP
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Code (server/index.js)                                  │
├─────────────────────────────────────────────────────────┤
│ const setupWebhookOnStart = async () => {              │
│   if (process.env.TELEGRAM_WEBHOOK_URL) {              │
│     await setupWebhook(process.env.TELEGRAM_WEBHOOK_URL)
│     console.log('[Telegram] Webhook configured: ...')  │
│   }                                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
        │
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Telegram API Call                                       │
├─────────────────────────────────────────────────────────┤
│ POST /setWebhook                                        │
│ ├─ url: "https://tinynotie-api.vercel.app/bot/webhook"│
│ ├─ allowed_updates: ["message", "callback_query", ...] │
│ └─ Returns: { ok: true, result: true }                 │
└─────────────────────────────────────────────────────────┘
        │
        │ SETUP COMPLETE ✅
        │
        ▼
     Ready to receive webhooks!
```

## Performance Comparison

```
┌────────────────────┬──────────────┬────────────┐
│ Metric             │ Polling      │ Webhook    │
├────────────────────┼──────────────┼────────────┤
│ Message Latency    │ 2-5 seconds  │ <100ms ⚡ │
│ Polling Requests   │ 3,600/hour   │ 0 (idle)   │
│ CPU Usage          │ High (loop)  │ Low        │
│ Memory Usage       │ High         │ Low        │
│ Database Calls     │ Continuous   │ On demand  │
│ Cost (per month)   │ $$$          │ $          │
│ Serverless Friendly│ No ❌        │ Yes ✅     │
│ Vercel Ideal?      │ Not at all   │ Perfect!   │
└────────────────────┴──────────────┴────────────┘
```

## Files Involved

```
Server Setup
├─ server/index.js
│  ├─ import { setupWebhook } from telegramBotService
│  ├─ const bot = initTelegramBot(token)
│  └─ setupWebhookOnStart() on server listen
│
├─ server/services/telegramBotService.js
│  ├─ initTelegramBot(token) - Initialize bot
│  ├─ setupWebhook(url) - Register webhook with Telegram
│  ├─ getWebhookInfo() - Get webhook status
│  └─ All handlers (commands, text, photos)
│
└─ server/routes/telegrambot.js
   ├─ POST /bot/webhook - Receive updates
   ├─ GET /bot/status - Check webhook status
   └─ GET /bot/webhook-info - Debug info

Documentation
├─ TELEGRAM_WEBHOOK_COMPLETE.md - Overview
├─ TELEGRAM_WEBHOOK_MIGRATION.md - Changes
├─ server/TELEGRAM_WEBHOOK_SETUP.md - Setup guide
├─ server/TELEGRAM_WEBHOOK_QUICK_REFERENCE.md - Commands
└─ server/telegram-webhook.sh - Helper script
```

That's it! Webhook mode is production-ready! 🚀
