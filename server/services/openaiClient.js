import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;

export const openai = new OpenAI({
  apiKey,
});

export const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
