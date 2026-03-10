import express from "express";
import { getBot, getWebhookInfo, setupWebhook } from "../services/telegramBotService.js";

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
    const configured = process.env.TELEGRAM_WEBHOOK_ASYNC;
    const isServerlessRuntime = Boolean(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.K_SERVICE
    );

    // Default behavior:
    // - serverless: sync (must finish before function exits)
    // - VM/container hosts: async (faster ack, resilient for long processing)
    const asyncMode = configured == null
      ? !isServerlessRuntime
      : String(configured).toLowerCase() !== "false";

    if (asyncMode) {
      // For Fly.io (always-on VM), acknowledge quickly to avoid Telegram timeout/retry storms.
      res.status(200).json({ ok: true, mode: "async" });

      setImmediate(async () => {
        try {
          await bot.handleUpdate(req.body);
        } catch (err) {
          console.error("[Telegram] Async webhook processing error:", err);
        }
      });
      return;
    }

    // Fallback synchronous mode (legacy behavior).
    await bot.handleUpdate(req.body);
    return res.status(200).json({ ok: true, mode: "sync" });
  } catch (err) {
    console.error("[Telegram] Error handling webhook update:", err);
    // Still return 200 to prevent Telegram retries, but log the error
    return res.status(200).json({ ok: true, error: err.message });
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

/**
 * POST /bot/setup-webhook
 * Configure webhook on Telegram using current deployed host
 */
router.post("/setup-webhook", async (req, res) => {
  try {
    const host = req.get("x-forwarded-host") || req.get("host");
    const proto = req.get("x-forwarded-proto") || req.protocol || "https";
    const webhookUrl = req.body?.webhookUrl || `${proto}://${host}/bot/webhook`;

    const ok = await setupWebhook(webhookUrl);
    const info = await getWebhookInfo();

    if (!ok) {
      return res.status(500).json({
        status: "error",
        message: "Failed to setup webhook",
        webhookUrl,
        webhookInfo: info,
      });
    }

    return res.json({
      status: "ok",
      message: "Webhook configured",
      webhookUrl,
      webhookInfo: info,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

export default router;
