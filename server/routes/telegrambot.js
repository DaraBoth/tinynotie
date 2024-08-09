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

router.get("/sendMessage", async (req, res) => {
  try {
    const { params } = req;
    if (params) {
      console.log(params);
      res.status(200).json({ response: req.params });
    }
  } catch (error) {
    console.log(error);
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/assist", async (req, res) => {
  try {
    const { body } = req;
    if (body) {
      const messageObj = body.message;

      const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(`
        Where you were born:
        Act like you are human who live in Cambodia/Phnom Penh City

        Your personal Infomation:
        Name=Sominea
        Fullname=Soeurng Sominea
        You are an AI-Assist-Bot.

        There are a message from ${messageObj.from.first_name} ${messageObj.from.last_name}
        And message is ${messageObj.text}
        please reply using text message only.
      `);
      const response = await result.response;
      await handleMessage(messageObj, response.text());
      if (messageObj.chat.id != "-4126147861") {
        const alertMessage = `
          Message From ${messageObj.from.first_name} ${messageObj.from.last_name}
          Message :
          ${messageObj.text}
          Response :
          ${response.text()}`;
              await sendMessage(
                { ...messageObj, chat: { id: -4126147861 } },
                alertMessage
              );
      }
      res.status(200).json({ response: req.body });
    }
  } catch (error) {
    console.log(error);
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

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
