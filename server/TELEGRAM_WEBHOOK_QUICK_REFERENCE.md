# Telegram Bot Webhook - Quick Reference

## Environment Variables Required

```bash
TELEGRAM_BOT_TOKEN_NEW=<your-bot-token>
TELEGRAM_WEBHOOK_URL=<your-webhook-url>
DATABASE_URL=<your-database-url>
```

## Checking Webhook Status

### Via Your API
```bash
# Check bot status
curl https://your-domain/bot/status

# Get detailed webhook info
curl https://your-domain/bot/webhook-info
```

### Via Telegram API (requires TELEGRAM_BOT_TOKEN_NEW)
```bash
BOT_TOKEN="your_token_here"

# Get webhook info
curl -X POST https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo

# Check me (bot info)
curl -X POST https://api.telegram.org/bot$BOT_TOKEN/getMe
```

## Setting Webhook Manually

```bash
BOT_TOKEN="your_token_here"
WEBHOOK_URL="https://your-domain.vercel.app/bot/webhook"

# Set webhook
curl -X POST https://api.telegram.org/bot$BOT_TOKEN/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'$WEBHOOK_URL'",
    "allowed_updates": ["message", "callback_query", "my_chat_member"]
  }'
```

## Deleting Webhook (Back to Polling)

```bash
BOT_TOKEN="your_token_here"

curl -X POST https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook
```

## Verifying Webhook Works

1. Send a message to your Telegram bot
2. Check Vercel logs:
```bash
vercel logs
```

3. Look for logs like:
```
[Telegram] Webhook configured: https://...
```

## Troubleshooting

### Webhook not called
```bash
# Check if webhook is registered
curl -X POST https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo | jq .result

# Should show:
# {
#   "url": "https://your-domain/bot/webhook",
#   "has_custom_certificate": false,
#   "pending_update_count": 0,
#   ...
# }
```

### Get pending updates (if webhook fails)
```bash
curl -X POST https://api.telegram.org/bot$BOT_TOKEN/getUpdates
```

### Webhook test message
Send this message to your bot in Telegram to trigger the webhook:
```
/status
```

## Files Modified

- `server/index.js` - Added webhook setup on startup
- `server/services/telegramBotService.js` - Added webhook functions
- `server/routes/telegrambot.js` - Improved webhook endpoint
- `server/TELEGRAM_WEBHOOK_SETUP.md` - Full setup guide
- `server/telegram-webhook.sh` - Helper script

## Quick Start for Vercel

1. **Deploy code**
   ```bash
   git push origin main
   ```

2. **Add environment variable in Vercel dashboard**
   ```
   TELEGRAM_WEBHOOK_URL=https://<your-domain>/bot/webhook
   ```

3. **Redeploy**
   ```bash
   vercel redeploy
   ```

4. **Test**
   ```bash
   curl https://<your-domain>/bot/status
   ```

5. **Send a message to your bot in Telegram** ✅

## Expected Response

When you POST to the webhook, the server should return:
```json
{
  "ok": true
}
```

If there's an error, it still returns 200 with error details (to prevent Telegram retries).
