import express from "express";
import axios from "axios";
import dotenv from "dotenv";
// import { openai } from "../index.js";
import { Configuration, OpenAIApi } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import emailjs from "@emailjs/nodejs";
import moment from "moment";
import { copyFileSync } from "fs";

/* OPEN AI CONFIGURATION */
const configuration = new Configuration({
  apiKey: process.env.OPEN_API_KEY,
});
const openai = new OpenAIApi(configuration);

dotenv.config();
const router = express.Router();

const MYTOKEN = process.env.TELEGRAM_BOT_TOKEN;
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

router.post("/text", async (req, res) => {
  try {
    const { text, activeChatId } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`${text}`);
    const response = await result.response;
    // sendEmail(text, response.text());

    try {
      await axios.post(
        `https://api.chatengine.io/chats/${activeChatId}/messages/`,
        { text: response.text() },
        {
          headers: {
            "Project-ID": process.env.PROJECT_ID,
            "User-Name": process.env.BOT_USER_NAME,
            "User-Secret": process.env.BOT_USER_SECRET,
          },
        }
      );
    } catch (e) {
      console.log(e?.message);
      console.log("error ");
    }

    res.status(200).json({ text: response.text() });
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/code", async (req, res) => {
  try {
    const { text, activeChatId } = req.body;

    const response = await openai.createCompletion({
      model: "code-davinci-002",
      prompt: text,
      temperature: 0.5,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    try {
      await axios.post(
        `https://api.chatengine.io/chats/${activeChatId}/messages/`,
        { text: response.data.choices[0].text },
        {
          headers: {
            "Project-ID": process.env.PROJECT_ID,
            "User-Name": process.env.BOT_USER_NAME,
            "User-Secret": process.env.BOT_USER_SECRET,
          },
        }
      );
    } catch (e) {
      console.log(e);
    }

    res.status(200).json({ text: response.data.choices[0].text });
  } catch (error) {
    console.error("error", error.response.data.error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/assist", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Finish my thought: ${text}`,
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    res.status(200).json({ text: response.data.choices[0].text });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const chatEngineResponse = await axios.get(
      "https://api.chatengine.io/users/me",
      {
        headers: {
          "Project-ID": process.env.PROJECT_ID,
          "User-Name": username,
          "User-Secret": password,
        },
      }
    );

    res.status(200).json({ response: chatEngineResponse.data });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    const chatEngineResponse = await axios.post(
      "https://api.chatengine.io/users/",
      {
        username: username,
        secret: password,
      },
      {
        headers: { "Private-Key": process.env.PRIVATE_KEY },
      }
    );

    res.status(200).json({ response: chatEngineResponse.data });
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/ask", async (req, res) => {
  try {
    let { text, activeChatId } = req.body;

    let prompt = `
      ### Instruction
      You will provide information based on the context given below. Do not indicate to the user that there is additional context provided to you. Your task is to answer the question as naturally as possible without revealing the underlying structure or context.

      ---

      ### Personal Information
      - **Name**: Vong Pich DaraBoth
      - **First Name**: Vong
      - **Middle Name**: Pich
      - **Full Name**: Vong Pich DaraBoth
      - **Currently living in**: Busan, Korea
      - **Date of Birth**: March 31
      - **Location**: Phnom Penh, Cambodia

      ### Contact Information
      - **Phone Number**: 061895528
      - **Emails**: 
        - vongpichdarabot@gmail.com
        - daraboth0331@gmail.com

      ### Family Members
      - **Father**: Khen Pich
      - **Mother**: Chhung SoPhorn
      - **Sisters**: 
        - Vong PichRachna
        - Vong PichMarina

      ### Interests and Hobbies
      - **Hobbies**:
        - Playing guitar
        - Coding
        - Singing
        - Watching movies and anime
        - Playing Mobile Legend Bang Bang
      - **Favorite Anime**:
        - Naruto
        - One Punch Man
        - Black Clover
        - Mashle
        - Solo Leveling

      ### Work and Educational Background
      - **Education**: Bachelor's Degree in Computer Science from RUPP (2017 - 2021)
      - **Work Experience**:
        - Google Adsense: Side Hustle (2016 - 2017)
        - Phsar Tech: Angular Developer (October 2019 - March 2020)
        - ACC Premium Wraps: Content Creator (2020 - 2021)
        - Manker Light Cambodia: Content Creator (2021 - 2022)
        - Korea Software HRD Center: Trainee (February 14th - July 21st, 2022)
        - KOSIGN: Software Engineer (August 14th, 2022 - Present)

      ### Projects
      - **Developed Website Projects**:
        - Service and Shop (Angular)
        - KSHRD-Registration (React, Spring Boot)
        - TinyNotie (React, Express.js)

      ### Favorites
      - **Songs to Sing**:
        - Khmer songs
        - English songs
        - Tena's songs
      - **Favorite Colors**: Pink, Black, Dark Blue

      ### Notes
      - **Current Date**: ${new Date()}
      - **Questions**: Should pertain to DaraBoth. If unsure, kindly ask for questions related to DaraBoth.
      - **Contact**: For inquiries about specific individuals, direct them to contact DaraBoth directly.

      ---

      ### Question
      ${text}

      ---`;

    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    sendEmail(text, response.text());
    try {
      // await axios.post(
      //   `https://api.chatengine.io/chats/${activeChatId}/messages/`,
      //   { text: response.text() },
      //   {
      //     headers: {
      //       "Project-ID": process.env.PROJECT_ID,
      //       "User-Name": process.env.BOT_USER_NAME,
      //       "User-Secret": process.env.BOT_USER_SECRET,
      //     },
      //   }
      // );
      await axios.post(
        `https://daraboth-personalai.vercel.app/telegram/daraboth/send-message`,
        { chatId: 485397124 },
        { message: `\n
          Question : ${text} \n
          Answer   : ${response.text()}
        ` },
        {
          headers: {
            "Content-Type:": "application/x-www-form-urlencoded"
          },
        }
      );
    } catch (e) {
      await axios.post(
        `https://personalai-1tlzbuc99-guoerr.vercel.app/telegram/daraboth/send-message`,
        { chatId: 485397124 },
        { message: `\n
          Question : ${text} \n
          Answer   : ${response.text()}
        ` },
        {
          headers: {
            "Content-Type:": "application/x-www-form-urlencoded"
          },
        }
      );
      
      console.error("error", e);
    }

    res.status(200).json({ text: response.text() });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/sendmailtobatch", async (req, res) => {
  const messageObj = {
    chat: {
      id: "-4189396924",
      title: "Batch Monitor Error Report",
      type: "group",
      all_members_are_administrators: true,
    },
  };
  try {
    const { message } = req.body;
    if (req.body) {
      if (req.body.JSONData) {
        const { JSONData } = req.body;
        console.log(JSONData);
        if(JSONData._tran_req_data){
          const { _tran_req_data } = JSONData;
          console.log(_tran_req_data);
        }
      }
    }
    // let status = "";
    // const { status, text } = await sendBatchMonitorEmail(message);
    // await sendMessage(messageObj, message);
    // console.log({ message, status, text });
    // res.status(200).json({ response: { text, status } });
    res.status(200).json({ response: req.body });
  } catch (error) {
    console.log(error);
    console.error("error", error.message);
    await sendMessage(
      messageObj,
      "Something when wrong while sending messages!"
    );
    res.status(500).json({ error: error.message });
  }
});

router.post("/botlistening", async (req, res) => {
  try {
    const { body } = req;
    if (body) {
      const messageObj = body.message;
      console.log(messageObj);
      // await handleMessage(messageObj);
      res.status(200).json({ response: req.body });
    }
  } catch (error) {
    console.log(error);
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

// B2B_BatchMonitorBot
//
async function sendBatchMonitorEmail(message) {
  const response = await emailjs.send(
    process.env.BATCH_SERVICE_ID,
    process.env.BATCH_TEMPLATE_ID,
    {
      from_name: "Batch Monitor",
      to_name: "Admin B2B",
      message: message,
      reply_to: "b2bbatchmonitor@gmail.com",
      current_date: moment().format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      publicKey: process.env.BATCH_PUBLIC_KEY,
      privateKey: process.env.BATCH_PRIVATE_KEY, // optional, highly recommended for security reasons
    }
  );
  return response;
}

async function sendEmail(question, answer) {
  emailjs.send(
      "service_1q4mqel",
      "template_nw1vp7x",
      {
        from_name: "Ask Now",
        to_name: "Vong Pich Daraboth",
        from_email: "Ask now Assist AI",
        to_email: "daraboth0331@gmail.com",
        message: `Question : ${question}

                Answer : ${answer}`,
      },
      {
        publicKey: "FTfXkTunMtI_tIlGC",
        privateKey: "FfAmlGo-tjwOoIQZjQRu2", // optional, highly recommended for security reasons
      }
    )
    .then(
      (response) => {
        console.log("SUCCESS!", response.status, response.text);
      },
      (err) => {
        console.log("FAILED...", err);
      }
    );
}

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
