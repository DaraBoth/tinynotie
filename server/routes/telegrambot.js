import express from "express";
import { getBot, getWebhookInfo } from "../services/telegramBotService.js";

const router = express.Router();

/**
 * POST /bot/webhook
 * Telegram sends updates to this endpoint via webhook
 */
router.post("/webhook", async (req, res) => {
  const bot = getBot();
  if (!bot) {
    console.error("[Telegram] Bot not initialized");
    return res.status(500).json({ error: "Bot not initialized" });
  }

  try {
    // Process the update from Telegram
    // Telegraf's handleUpdate method processes the update through all middlewares and handlers
    await bot.handleUpdate(req.body);
    
    // Always return 200 OK to Telegram immediately
    // This prevents Telegram from retrying the webhook
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[Telegram] Error handling webhook update:", err);
    // Still return 200 to prevent Telegram retries, but log the error
    res.status(200).json({ ok: true, error: err.message });
  }
});

/**
 * GET /bot/status
 * Check bot status and webhook configuration
 */
router.get("/status", async (req, res) => {
  const bot = getBot();
  
  if (!bot) {
    return res.status(500).json({
      status: "error",
      message: "Bot not initialized",
    });
  }

  try {
    const webhookInfo = await getWebhookInfo();
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/bot/webhook` : "not configured");
    
    res.json({
      status: "ok",
      botInitialized: true,
      webhookUrl,
      webhookInfo: webhookInfo || { pending_update_count: 0 },
      mode: "webhook"
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

/**
 * GET /bot/webhook-info
 * Detailed webhook debug information
 */
router.get("/webhook-info", async (req, res) => {
  try {
    const webhookInfo = await getWebhookInfo();
    res.json({
      webhookInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
