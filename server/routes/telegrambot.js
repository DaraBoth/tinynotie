import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const router = express.Router();

const MYTOKEN = process.env.TELEGRAM_BOT_TOKEN3;
const baseURL = `https://api.telegram.org/bot${MYTOKEN}`;

const AxiosTelegramBotInstance = {
  get(method, params) {
    return axios.get(`/${method}`, {
      baseURL: baseURL,
      params,
    });
  },
  post(method, data) {
    return axios({
      method: "POST",
      baseURL: baseURL,
      url: `/${method}`,
      data,
    });
  },
};

const sendMessage = function (messageObj, messageText) {
  return AxiosTelegramBotInstance.get("sendMessage", {
    chat_id: messageObj.chat.id || "",
    text: messageText,
  });
};

const handleMessage = function (messageObj, messageText) {
  const { id: Chat_ID } = messageObj.chat;
  if (!messageText) messageText = messageObj.text || "";
  switch (Chat_ID) {
    case "-4189396924":
      // send error message logic
      break;
    default:
      if (messageText.charAt(0) === "/") {
        const command = messageText.substr(1);
        switch (command) {
          case "start":
            return sendMessage(messageObj, "Hi! bro");
          default:
            return sendMessage(
              messageObj,
              "Hey hi, I don't know that command."
            );
        }
      } else {
        return sendMessage(messageObj, messageText);
      }
  }
};

export default router;
