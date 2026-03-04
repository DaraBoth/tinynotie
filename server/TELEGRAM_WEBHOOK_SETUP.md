# Telegram Bot Webhook Configuration

This document explains how to set up and configure the Telegram bot to use webhooks instead of polling, which is ideal for serverless environments like Vercel.

## Overview

The bot has been converted from polling mode to webhook mode:
- **Polling (OLD)**: Bot continuously asks Telegram "do you have updates for me?"
- **Webhook (NEW)**: Telegram sends updates directly to your server when they occur

Webhooks are more efficient and perfect for serverless platforms like Vercel.

## Prerequisites

- Your Vercel deployment URL or custom domain
- Telegram Bot Token from BotFather
- The bot must be deployed and accessible via HTTPS

## Environment Variables

Add these to your Vercel environment variables:

```
TELEGRAM_BOT_TOKEN_NEW=<your-bot-token>
TELEGRAM_WEBHOOK_URL=https://<your-vercel-domain>/bot/webhook
```

For example:
```
TELEGRAM_WEBHOOK_URL=https://tinynotie-api.vercel.app/bot/webhook
```

## Setup Instructions

### Step 1: Deploy to Vercel

Ensure your latest code is deployed to Vercel and the server is running.

### Step 2: Set Environment Variables

In your Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add `TELEGRAM_WEBHOOK_URL` with your webhook endpoint
3. Redeploy the project

### Step 3: Verify Webhook Setup

Once deployed, the webhook will be automatically set up on server startup. You can verify it by:

```bash
curl https://<your-vercel-domain>/bot/webhook-info
```

This will show you the current webhook configuration.

### Step 4: Test the Bot

Send a message to your Telegram bot and it should respond. Check server logs in Vercel for any errors.

## API Endpoints

### `POST /bot/webhook`
- **Description**: Telegram sends updates to this endpoint
- **Called by**: Telegram servers automatically
- **Response**: `{ ok: true }`

### `GET /bot/status`
- **Description**: Check bot status and webhook configuration
- **Response**: 
```json
{
  "status": "ok",
  "botInitialized": true,
  "webhookUrl": "https://...",
  "webhookInfo": { ... },
  "mode": "webhook"
}
```

### `GET /bot/webhook-info`
- **Description**: Detailed webhook debug information
- **Response**: Telegram's webhook info including pending updates, URL, etc.

## Local Development

For local development, you have two options:

### Option A: Tunnel with ngrok (Recommended)
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel to local port 9000
ngrok http 9000

# Copy the HTTPS URL and use it as webhook:
# https://xxxx-xxx-xxx-xxx.ngrok.io/bot/webhook
```

Then set `TELEGRAM_WEBHOOK_URL` to the ngrok URL and run your server.

### Option B: Polling Mode (Development Only)
For development without webhook, modify `server/index.js`:
```javascript
// Uncomment for polling mode (development only)
// bot.launch();
```

Then run: `npm run dev`

## Troubleshooting

### Webhook not being called
1. Check that `TELEGRAM_WEBHOOK_URL` is set correctly
2. Verify your Vercel domain is accessible via HTTPS
3. Check Vercel logs: `vercel logs`
4. Call `/bot/webhook-info` to see if webhook is registered

### "Failed to setup webhook"
- Make sure the bot token is correct
- Ensure the webhook URL is valid and accessible
- Check that your server can make outbound requests to Telegram's API

### "Bot not initialized"
- Server hasn't started yet or bot initialization failed
- Check for errors in Vercel logs related to `TELEGRAM_BOT_TOKEN_NEW`

### Getting webhook info
```bash
curl https://<domain>/bot/webhook-info
```

Should return something like:
```json
{
  "webhookInfo": {
    "url": "https://...",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "allowed_updates": ["message", "callback_query", "my_chat_member"],
    "last_error_date": null,
    "last_synchronization_error_date": null
  }
}
```

## Database Connection

The bot still uses the database for:
- Linking user accounts to Telegram IDs
- Linking Telegram groups to TinyNotie groups
- Storing user context for AI agent
- Sending notifications to groups

Make sure `DATABASE_URL` is also configured in environment variables.

## Limitations

- Webhook URL must be HTTPS
- Must be accessible from the internet (no localhost)
- Telegram requires a valid SSL certificate

## References

- [Telegraf.js Documentation](https://telegraf.dev/)
- [Telegram Bot API Webhook Documentation](https://core.telegram.org/bots/api#setwebhook)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
