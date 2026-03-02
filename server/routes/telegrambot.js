import express from "express";
import { getBot } from "../services/telegramBotService.js";

const router = express.Router();

// Webhook endpoint for Telegram
router.post("/webhook", async (req, res) => {
  const bot = getBot();
  if (!bot) {
    console.error("Bot not initialized");
    return res.status(500).send("Bot not initialized");
  }

  try {
    // Process the update from Telegram
    await bot.handleUpdate(req.body);
    res.send("OK");
  } catch (err) {
    console.error("Error handling Telegram update:", err);
    res.status(500).send("Error");
  }
});

// For testing or manual triggers
router.get("/status", (req, res) => {
  const bot = getBot();
  res.json({
    status: "ok",
    botInitialized: !!bot,
    webhookUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/bot/webhook` : "local"
  });
});

export default router;
