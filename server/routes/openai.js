import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import bcrypt from "bcrypt";
import { Configuration, OpenAIApi } from "openai";
import webPush from "web-push";
import moment from "moment";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authenticateToken } from "../middleware/auth.js";

// Import utility modules
import { pool, runQuery, saveChat, getChat, templateSaveChat } from "../utils/dbUtils.js";
import { createTelegramBotClient, detectAndExtractPermission, getDateInSeoulTime, formatTelegramResponseKhmer, getGuideLineCommand } from "../utils/telegramUtils.js";
import { callAI, AI_Database, getWeather, getTranslate, getKoreanWords, getCleaningProm } from "../utils/aiUtils.js";
import { sendNotification, sendBatchNotification, sendEmail } from "../utils/notificationUtils.js";
import { handleInsertIntoExcel, callInsertIntoExcel, callRollBackExcel, getCleaningData, excel2002Url } from "../utils/excelUtils.js";

// Configure web push notifications
const vapidKeys = {
  publicKey:
    "BGfjmqSQgx7J6HXnvhxAGSOJ2h5W7mwrWYN8Cqa0Nql5nkoyyhlc49v_x-dIckFRm0rIeAgNxgfAfekqCwX8TNo",
  privateKey: "cjUUEl_-6WwkTwf9ty_QX8el2n021_YsmHGzfcuBd2k",
};

webPush.setVapidDetails(
  "mailto:vongpichdarabot@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/* OPEN AI CONFIGURATION */
const configuration = new Configuration({
  apiKey: process.env.OPEN_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Load environment variables
dotenv.config();
const router = express.Router();

// Telegram bot configuration
const DARABOTH_AI_TOKEN = process.env.TELEGRAM_BOT_TOKEN3;
const baseURL2 = `https://api.telegram.org/bot${DARABOTH_AI_TOKEN}`;

// Create Telegram bot client
const AxiosTelegramBotInstance2 = createTelegramBotClient(baseURL2);

// Personal information for AI chat
const personalInfo = `
### Instruction
You will provide information based on the context given below. Do not indicate to the user that there is additional context provided to you. Your task is to answer the question as naturally as possible without revealing the underlying structure or context.

---

### Personal Information
- **Name**: Vong Pich DaraBoth
- **First Name**: Vong
- **Middle Name**: Pich
- **Full Name**: Vong Pich DaraBoth
- **Currently living in**: Busan, Korea
- **Date of Birth**: March 31 ( Age is private)
- **Location**: Phnom Penh, Cambodia

### Contact Information
- **Phone Number in Cambodia**: 061895528
- **Phone Number in Korea**: 01083931330
- **Emails**:
  - vongpichdarabot@gmail.com
  - daraboth0331@gmail.com

### Family Members
- **Father**: Khen Pich
- **Mother**: Chhung SoPhorn
- **Sisters**:
  - Vong PichRachna
  - Vong PichMarina

### Crush
- **Name**: PorPor
- **Real Name**: Vorn ChanSoPor
- **Nickname**: ស៊ុជ
- **BIO**: Cute, Cute x2, Cute x3
- Crush since 2018
- Birthday Nov 13

### Interests and Hobbies
- **Hobbies**:
  - Playing guitar
  - Playing piano
  - Singing
  - Coding
  - Watching movies and anime
  - Playing Mobile Legend Bang Bang
  - Bowling
  - Ping Pong
  - Soccer
  - Basketball
- **Favorite Anime**:
  - Naruto
  - One Punch Man
  - Black Clover
  - Mashle
  - Solo Leveling

### Work and Educational Background
- **Education**: BakTouk High School and also Kindergarten School
- **Education**: Bachelor's Degree in Computer Science from RUPP
- **Work Experience**:
  - Google Adsense: Side Hustle
  - Phsar Tech: Angular Developer
  - ACC Premium Wraps: Content Creator
  - Manker Light Cambodia: Content Creator
  - Korea Software HRD Center: Trainee
  - KOSIGN: Software Engineer (Present)

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

### Love Life
- **Relationship status**:
  - single
- **Current Feeling**:
  - Slanh ke mnek eng

### Real Daraboth
- Telegram ID
  - @l3oth
  (give them if they want to contact me)

### Notes
- **Current Date**: ${new Date()}
- **Questions**: Should pertain to DaraBoth. If unsure, kindly ask for questions related to DaraBoth.
- **Contact**: For inquiries about specific individuals, direct them to contact DaraBoth directly.
---`;

router.get("/text", async (req, res) => {
  try {
    let { text, random } = req.query;
    const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    if (random == "true") {
      const prompt = `
        ### Instruction ###
        Generate a piece of content on one of the following topics:
        - Programming
        - Computer Science
        - AI-related News
        - Daily Motivational Story

        ### Context ###
        1. **Programming**: Write about the latest trends, new libraries, or frameworks.
        2. **Computer Science**: Cover recent breakthroughs or interesting research.
        3. **AI-related News**: Report on a new AI model or an advancement in the field.
        4. **Daily Motivational Story**: Create a story about someone overcoming challenges in their tech career.

        ### Example ###
        1. **Programming**:
          Python continues to evolve with new libraries like FastAPI for web development and Pydantic for data validation. These tools are making it easier for developers to build robust applications quickly.

        2. **Computer Science**:
          Scientists at MIT have developed a new quantum algorithm that reduces computation time for complex problems from days to hours. This advancement could revolutionize fields like cryptography and materials science.

        3. **AI-related News**:
          OpenAI's latest model, GPT-5, has set a new benchmark in natural language processing. With its advanced capabilities, it can perform tasks ranging from translation to creative writing with human-like proficiency.

        4. **Daily Motivational Story**:
          Jane, a self-taught programmer, struggled for years to break into the tech industry. Despite numerous rejections, she continued to learn and improve her skills. Her persistence paid off when she landed a job at a leading tech company, proving that determination can overcome any obstacle.

        ### Instructions ###
        Choose one of the topics and generate a piece of content following the context and examples provided. Ensure that the content is informative, engaging, and relevant to the chosen topic.`;
      text = prompt;
    }

    const result = await model.generateContent(`${text}`);
    const response = result.response;
    console.log({ text });
    console.log({ res: response.text() });
    // res.status(200).json({ text: response.text() });
    // res.status(200).json({
    //   text: "My name is Daraboth. May I ask who are you? Please reply in my AskMore tap.",
    // });
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/text", async (req, res) => {
  try {
    const { text, chatId } = req.body;
    let chatHistory = [];

    if (chatId) {
      getChat({
        chat_id: chatId,
        onSuccess: ({ results }) => {
          if (results != []) {
            chatHistory = results;
          } else {
            chatHistory = defaultChatHistory;
            saveChat({ chat_id: chatId, chat_history: chatHistory });
          }
        },
        onError: (response) => {
          console.log({ response });
        },
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`${text}`);
    const response = result.response;
    saveChat({ chat_id: chatId, chat_history: chatHistory });

    res.status(200).json({ text: response.text() });
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/askDatabase", async (req, res) => {
  try {
    const { userAsk, userAskID, chatHistory } = req.body;

    const responseData = await AI_Database(userAsk, userAskID, chatHistory);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/receiptText", async (req, res) => {
  try {
    let { text } = req.query;
    const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an API endpoint that processes receipt data.
      Based on the text extracted from the receipt, you must respond only in proper JSON format using the structure below.
      The key "data" should contain an array of objects where each object represents an **item** from the receipt, along with its price and additional metadata.
      Use the following format:

      {
          "status": true,
          "data": [
              {
                  "trp_name": "[Item Name]",
                  "spend": [Price],
                  "mem_id": "[]",
                  "create_date": "[${moment()
                    .add(9, "hours")
                    .format("YYYY-MM-DD HH:mm:ss")} or Date from Receipt]"
              },
              ...
          ]
      }

      **Important**: Do not respond with an escaped JSON string (e.g., \`\`\`json\\n{\ ... }\`\`\`). You must return a **clean JSON object** without escape characters. Each key-value pair should be properly structured as a JSON object, and the output must not include any stringified or escaped characters.

      Ensure all values are formatted correctly and none of them are null. Follow these rules for each field:
      - "trp_name" should always be the name of the **item** from the receipt (e.g., Coca-Cola, Burger). If no item name is found, return an empty string ("").
      - "spend" should always be the **price** of the item. If no price is found, set it to 0.
      - "mem_id" is always set to "[]".
      - "create_date" should use the **date from the receipt** if available. If no date is found, use the current date and time in the format YYYY-MM-DD HH:mm:ss.

      Here is the extracted text from the receipt:

      ${text}

      Ensure all values are formatted correctly. Each item from the receipt should have its corresponding price in "spend". If any information is missing or unclear, leave "description" blank. No values in the response should be null or undefined.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    console.log({ text });
    console.log({ res: response.text() });
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

router.get("/translate", async (req, res) => {
  try {
    const { query } = req;
    if (query) {
      const str = query.message;
      console.log(str);
      const resText = await getTranslate(str);
      res.status(200).json({ theTranslateFor: str, isTranslatedTo: resText });
    }
  } catch (error) {
    console.log(error);
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

// personalInfo is already defined at the top of the file

const friendInfo = `
### Friends
Name: [Davin Sou] (ah vin)
BIO [Love one girl is enough. But I'm not a girl.]
Location: [Phnom Penh]

Name: [Chey ChansovanRith] (rith moki)
BIO [Going to the gym everyday is eaiser than explaining her wha's going on.]
Location: [Phnom Penh]

Name: [Honn Molizak] (OK bek)
BIO [My friend told me to stop drinking everyday. So I drink everynight.]
Location: [Phnom Penh]

Name: [Thai Khahy] (ah hy)
BIO [I like girl but girl don't like me.]
Location: [Phnom Penh]

Name: [Hun Socheat] (쏘찌엇)
BIO [គីប less]
Location: [Busan]

Name: [Mean Khaw] (b khaw)
Phone Number: [010 7428 4635]
BIO [Fall in love with her alone, because I am introvert.]
Location: [Busan, South Korean]

Name: [Ngoeun Chivorn] (b jione)
Phone Number: [070 414 707]
BIO [Nothing more common than unsuccessful people with talent.]
Location: [Phnom Penh]
`;

router.post("/ask", async (req, res) => {
  try {
    let { text, chatHistory } = req.body;
    const response = await callAI(text, chatHistory);
    console.log("response: ", response);
    sendEmail(text, response.text());
    res.status(200).json({ text: response.text() });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/darabothlistening", async (req, res) => {
  try {
    const { body } = req;
    if (body) {
      const messageObj = body.message;
      console.log(messageObj);
      await handleMessage(messageObj);
      res.status(200).json({ response: req.body });
    }
  } catch (error) {
    console.log(error);
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to handle b2bAlert requests
router.post("/b2bAlert", async (req, res) => {
  try {
    // Time-based restrictions are commented out for now
    // const now = new Date();
    // const cambodiaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // Adding 7 hours in milliseconds
    // if (cambodiaTime.getDay() !== 5) { // 5 represents Friday
    //   return res.send("Request not allowed. This endpoint can only be accessed on Fridays in Cambodia time.");
    // }

    // Fetch the message from the Google Apps Script API
    const scriptApiUrl =
      "https://script.googleusercontent.com/macros/echo?user_content_key=TwsJ7jex6PLemF05p9BdK_BCbEE531R1GrA5gM2l1r58ZRdw9bc7m3dbclp6GYpBDmOBr8XiaCzLr1aCuU-Dmxzxjw5Jdazbm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnPNSmOPPBzQR8lozoT6OxwPGQrgpAfI0wKXXrvzxMs-fHM23NmVLxLY3liaL8_dl_6mDP4EpG_7YO_8v-RFpfCGytJTJy1FNew&lib=MPxRb7it3yuEbLSAksiFzB9tuFW5X_7rU"; // Provided API URL
    const scriptResponse = await axios.get(scriptApiUrl); // Make a GET request to the Google Apps Script API

    if (scriptResponse.status !== 200) {
      return res
        .status(500)
        .send("Failed to fetch message from Google Apps Script API.");
    }

    // Extract message from the JSON response
    const { message } = scriptResponse.data; // Extracting the 'message' field from the JSON response
    let isTest = req.body?.isTest;

    if (!isTest) {
      isTest = false;
    }

    const messageObj = {
      chat: {
        id: -861143107, // Replace with the actual user chat ID
        // id: isTest ? 485397124 : -861143107, // Uncomment if you want to use different IDs for testing
      },
    };

    // Send the message using darabothSendMessage function
    await darabothSendMessage(messageObj, message);

    // Respond with a success message including the message details
    res.status(200).send({ ...messageObj, message });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("Error processing data");
  }
});

router.post("/sendMessageViaBot", async (req, res) => {
  let { telegramObjectRecord } = req.body; // telegramObjectRecord = [ { chatId: 123456, message: "Hello" } ]
  let response = [];
  console.log("resquest: ",telegramObjectRecord);
  console.log("type = ",typeof telegramObjectRecord);
  console.log("more then 0 = ",telegramObjectRecord.length > 0);
  if(Array.isArray(telegramObjectRecord) && telegramObjectRecord.length > 0) {
    for (const telegramObject of telegramObjectRecord) {
      try {
        const messageObj = { chat: { id: telegramObject?.chatId } };
        await darabothSendMessage(messageObj, telegramObject?.message);
        response.push({ chatId: telegramObject?.chatId, message: telegramObject.message, status: true });
      } catch (error) {
        response.push({ chatId: telegramObject?.chatId, message: telegramObject.message, status: false });
        console.error("Error parsing JSON:", error);
      }
    }
    res.status(200).send({ response });
  }else {
    res.status(200).send({ status: false, message: "Incorrect data", telegramObjectRecord :[ { chatId: 123456, message: 'Hello' } ] });
  }
});

router.post("/cleaningAlert", async (req, res) => {
  let { message, data, isNotAlert } = req.body;
  message = message || "Who is cleaning this week?";
  try {
    const chatIds = [485397124]; // Array of chat IDs to send messages to
    if(!isNotAlert) {
      const data = await getCleaningData();
      res.status(200).send({ status: true, data });
    }else {
      for (const chatId of chatIds) {
        const messageObj = { chat: { id: chatId } };
        if(!data) {
          data = await getCleaningData();
        }
        let resText = await getCleaningProm(data, message);
        await darabothSendMessage(messageObj, resText);
      }
      res.status(200).send({ status: true, data });
    }
  } catch (error) {
    console.error("Error parsing JSON:", error);
    res.status(500).send("Error processing data");
  }
});

router.post("/getKoreanWords", async (_, res) => {
  try {
    const chatIds = [485397124]; // Array of chat IDs to send messages to

    for (const chatId of chatIds) {
      const messageObj = { chat: { id: chatId } };

      // Get Korean words for each chat ID
      const resText = await getKoreanWords(messageObj);

      // Send message to each chat ID
      await darabothSendMessage(messageObj, resText);
    }
    res.status(200).send({ resText: "done" });
  } catch (error) {
    console.error("Error parsing JSON:", error);
    res.status(500).send("Error processing data");
  }
});

// This function has been moved to aiUtils.js
async function _getKoreanWords(messageObj) {
  if (!messageObj) return;
  const Chat_ID = 1083931330;
  let chatHistory = [];

  getChat({
    chat_id: Chat_ID,
    onSuccess: ({ results }) => {
      if (results != []) {
        chatHistory = results;
      } else {
        chatHistory = defaultChatHistory;
        saveChat({ chat_id: Chat_ID, chat_history: chatHistory });
      }
    },
    onError: (response) => {
      console.log({ response });
    },
  });

  const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  You are a Korean language tutor.

  Each day, introduce me to 2 new Korean words that are especially useful for everyday life, work currently living in Busan, Korea. Choose words that go beyond basic beginner level, focusing on vocabulary that would be helpful both in daily activities and professional situations in Korea.

  1. Select one **object** word that might be relevant or commonly encountered.
  2. Select one **verb** that is useful in work, social, or daily settings.

  Provide the meaning in both English and Khmer, along with an example sentence and its English translation. Avoid repeating words by checking the chat history.

  Send the response in plain text, formatted simply for Telegram without any markdown symbols or unnecessary labels.

  Template for Daily Korean Vocabulary Lesson:

  **Word 1** (Object):
  Korean: [Korean word]
  Pronunciation: [Pronunciation]
  Meaning: [Meaning in English]
  Khmer Meaning: [Meaning in Khmer]
  Example: [Example sentence in Korean]
  Translation: [Translation of example in English]

  **Word 2** (Verb):
  Korean: [Korean word]
  Pronunciation: [Pronunciation]
  Meaning: [Meaning in English]
  Khmer Meaning: [Meaning in Khmer]
  Example: [Example sentence in Korean]
  Translation: [Translation of example in English]

  **Practice:**
  Try creating your own sentence using one or both of today’s words.

  `;

  const result = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 250,
    },
  });

  const chat = await result.sendMessage(prompt);
  const response = chat.response;
  console.log("response text : " + response.text());

  templateSaveChat({
    Chat_ID,
    chatHistory,
    messageText: "Let's start learning today!",
    responseText: response.text(),
  });

  return response.text();
}

// This function has been moved to aiUtils.js
async function _getCleaningProm(data, msg) {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
      This data is about cleaning schedule in a house.
      And it's a trigger when there is change updated in excel.
      The number is refer to their step one after another.
      The number if it meet the last index it will go back to the first person.
      THe memberName is the house member's name.
      Look to the array in each object the "isTurnToClean" key is there turn to clean.
      So answer to the question depend on the user want.
      Today date = ${moment().format("YYYY-MM-DD HH:mm:ss (dd) Z")} // format YYYY-MM-DD HH:mm:ss (dd) Z

      Here is the data in JSON :
      ${JSON.stringify(data)}

      Here is the user request:
      ${msg}

      Please response back to user as report text.
      `;

  const result = await model.generateContent(prompt);
  const response =  result.response;
  console.log("response text : " + response.text());

  return response.text();
}

// This function has been moved to aiUtils.js
async function _getTranslate(str) {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
      Instruction
      Translate the following text based on its original language:
      - If the text is in English, translate it into Korean using a highly polite and formal tone, suitable for communication with managers, team leaders, and coworkers.
      - If the text is in Korean, translate it into English with a tone that reflects respect and professionalism, similar to the style in the examples provided.
      - Don't translate to the same language that provided.

      Examples
      English to Korean:
      "Development has been completed. Please test."
      -> "개발 완료 되었습니다. 테스트 부탁드립니다."

      "The requested data has been shared."
      -> "요청하신 데이터 공유드립니다."

      "Thank you for your help. I'll try again based on your guidance."
      -> "도와주셔서 대단히 감사합니다. 알려주신 내용을 바탕으로 다시 시도해 보겠습니다."

      Korean to English:
      "개발 완료 되었습니다. 테스트 부탁드립니다."
      -> "Development has been completed. Please test."

      "요청하신 데이터 공유드립니다."
      -> "The requested data has been shared."

      "도와주셔서 대단히 감사합니다. 알려주신 내용을 바탕으로 다시 시도해 보겠습니다."
      -> "Thank you for your help. I'll try again based on your guidance."

      Text to Translate
      [${str}]
      `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  console.log("response text : " + response.text());

  return response.text();
}

// This function has been moved to excelUtils.js
async function _getCleaningData() {
  // The URL of your Google Apps Script API
  try {
    const apiUrl =
      "https://script.googleusercontent.com/macros/echo?user_content_key=_sjjP7YKbjfWG0W0Tp5khOW-QR_PzMXzahriixTLT_UtSDvB9NT8G4ab_EGdP3g_6VhJjaOMp96w1bhj0Q8tAXtrqnl8pKvGm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnJCh9wLAX3HAVOC_de-Tzi9BzR6Bc71bL0AOS9tdApgjUFznXoC36iasDRB3m4V8eLN5KPbUI_b2iyutjQZM6ZfrcSVvJ-njt9z9Jw9Md8uu&lib=MgKmp91GXkA9SSJzubbc_qu8MXP5Cr7Q7";

    // Make the API call using axios
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching cleaning data:", error);
    return { error: "Failed to fetch cleaning data." };
  }
}

// This function has been moved to notificationUtils.js
async function _sendEmail(question, answer) {
  emailjs
    .send(
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

/**
 * Send a message using the Daraboth Telegram bot
 * @param {Object} messageObj - The message object
 * @param {string} messageText - The message text
 * @returns {Promise} - A promise that resolves with the response
 */
const darabothSendMessage = function (messageObj, messageText) {
  return AxiosTelegramBotInstance2.get("sendMessage", {
    chat_id: messageObj.chat.id || "",
    text: messageText,
  });
};

const handleMessage = async function (messageObj) {
  if (!messageObj) return;
  const { id: Chat_ID } = messageObj?.chat;
  let messageText = messageObj?.text + "" || "";
  let chatHistory = [];
  let chatType = messageObj?.chat?.type;
  const isCommand = messageText.startsWith("/");
  // data
  let username = messageObj.from.username;
  const first_name = messageObj.from.first_name;
  const last_name = messageObj.from.last_name;
  const telegram_chat_id = messageObj.chat.id;
  const is2002Group = chatType == "supergroup" && Chat_ID == "-1002369402163";
  const isDaraboth = username == "l3oth";

  // is command
  if (isCommand) {
    const command = messageText.slice(1).toLocaleLowerCase();
    if (command.startsWith("start")) {
      return darabothSendMessage(messageObj, "Hello I'm Daraboth");
    } else if (command.startsWith("translate")) {
      const resText = await getTranslate(command.replace("translate", ""));
      return darabothSendMessage(messageObj, resText);
    } else if(command.startsWith("getweather")) {
      const weatherText = await getWeather();
      return darabothSendMessage(messageObj, weatherText);
    } else if(is2002Group) {
      const khDate = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩", "១០", "១១", "១២"];
      const memID = {
        "l3oth":"Both",
        "seudylim":"Seudy",
        "hounhong":"Hong",
        "sim_kimheang":"Kimheang",
        "sovanthoeun88":"សុវណ្ណធឿន",
        "cooconratha":"រដ្ឋា",
      }
      if(command.startsWith("donetopup")) {
        const date = moment(getDateInSeoulTime());
        const requestJsonData = {
          "operatingDate": date.format("YYYY-MM-DD"),
          "withdrawal": 0,
          "deposit": 10000,
          "operatingLocation": "",
          "notes": "បង់លុយខែ"+ khDate[Number(date.format("MM"))],
          "other": memID[messageObj.from.username]
        }
        const response = await callInsertIntoExcel(requestJsonData);
        const telegramResponse = formatTelegramResponseKhmer(response, messageObj);
        return darabothSendMessage(messageObj, telegramResponse);
      } else if(command.startsWith("buystuff")) {
        const requestJson = await handleInsertIntoExcel({ messageObj, messageText: command.replace("buystuff", "") });
        try {
          const requestJsonData = JSON.parse(requestJson);
          if(requestJsonData){
            const response = await callInsertIntoExcel(requestJsonData);
            const telegramResponse = formatTelegramResponseKhmer(response, messageObj);
            return darabothSendMessage(messageObj, telegramResponse);
          }
        }catch(e) {
          console.log(e);
          return darabothSendMessage(messageObj, requestJson)
        }
      } else if(command.startsWith("rollback")) {
        const response = await callRollBackExcel();
        if(response?.status) {
          return darabothSendMessage(messageObj, response?.message);
        }else {
          return darabothSendMessage(messageObj, "Rollback Failed");
        }
      } else if(command.startsWith("whoclean")) {
        // will send schedule of cleaning
        const cleaningData = await getCleaningData();
        const cleaningMessage = await getCleaningProm(cleaningData, command.replace("whoclean", "who clean"));
        return darabothSendMessage(messageObj, cleaningMessage);
      } else if(command.startsWith("excel2002")) {
        // will send the excel link
        return darabothSendMessage(messageObj, excel2002Url)
      } else if(command.startsWith("guideline")) {
        return darabothSendMessage(messageObj, getGuideLineCommand());
      }
    } else if (chatType == "private") {
      // special feature only private mode
      if (command.startsWith("register")) {
        // check if user already existed
        let sql = `SELECT * FROM user_infm WHERE telegram_chat_id = $1;`;
        let values = [telegram_chat_id];
        let { rows } = await pool.query(sql, values);
        if (rows.length === 0) {
          // check if id existed
          sql = `SELECT * FROM user_infm WHERE usernm = $1;`;
          values = [username];
          const { rows } = await pool.query(sql, values);
          if (rows.length === 0) {
            // if not exist then create user
            sql = `INSERT INTO user_infm (usernm, passwd, first_name, last_name, telegram_chat_id ,create_date) VALUES ($1,$2,$3,$4,$5,$6) `;
            const hashedPassword = await bcrypt.hash("123456", 10);
            try {
              await runQuery({
                sql,
                values: [
                  username,
                  hashedPassword,
                  first_name,
                  last_name,
                  telegram_chat_id + "",
                  moment().format("YYYYMMDDHH:mm:ss"),
                ],
              });
              await darabothSendMessage(
                messageObj,
                `Register Successful \n Username: ${username} \n Password: 123456`
              );
              return darabothSendMessage(
                messageObj,
                "How to Set Your Password \n Format: /password [YourPassword] \n Example: /password Rt@231"
              );
            } catch (error) {
              console.error("Error executing query:", error);
              await ErrorReport(
                { ...messageObj, chat: { id: 485397124 } },
                error
              );
              return darabothSendMessage(
                messageObj,
                `Wait there is an error. I'll send report to my boss @l3oth `
              );
            }
          } else {
            return darabothSendMessage(
              messageObj,
              `Username: ${username} already exist`
            );
          }
        } else {
          return darabothSendMessage(
            messageObj,
            `U already register with this chat`
          );
        }
      } else if (command.startsWith("password")) {
        // check if user already existed
        let sql = `SELECT * FROM user_infm WHERE telegram_chat_id = $1;`;
        let values = [telegram_chat_id];
        let { rows } = await pool.query(sql, values);
        if (rows.length > 0) {
          let newPassword = messageText.replace("/password", "").trim();
          newPassword = messageText.replace("/Password", "")
          if (newPassword.length === 0) {
            return darabothSendMessage(
              messageObj,
              "Please provide a password."
            );
          }
          if (newPassword.length < 6) {
            return darabothSendMessage(
              messageObj,
              "Password must be at least 6 characters long."
            );
          }
          sql = `UPDATE user_infm set passwd = $1 where usernm = $2;`;
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          try {
            await runQuery({ sql, values: [hashedPassword, username] });
            return darabothSendMessage(
              messageObj,
              `Don't let others know your password. \n Your password is now set to ${newPassword} \n Link to app: https://tinynotie.vercel.app/`
            );
          } catch (error) {
            console.error("Error executing query:", error);
            await ErrorReport(
              { ...messageObj, chat: { id: 485397124 } },
              error
            );
            return darabothSendMessage(
              messageObj,
              `Wait there is an error. I'll send report to my boss @l3oth `
            );
          }
        }
      } else if (command.startsWith("allow") && (chatType == "group" || chatType == "supergroup")) {
        if ((chatType == "group" || chatType == "supergroup")) {
          let sql = `SELECT usernm FROM user_infm WHERE usernm = $1;`;
          let values = [username];
          const { rows } = await pool.query(sql, values);

          if (rows.length > 0) {
            sql = `INSERT INTO tel_grp_chat (usernm, group_chat_id, group_chat_title) VALUES ($1, $2, $3)`;
            try {
              const groupTitle = messageObj.chat.title;
              const groupChatId = messageObj.chat.id;
              await runQuery({
                sql,
                values: [username, groupChatId + "", groupTitle],
              });
              await darabothSendMessage(
                messageObj,
                `@${username} has allowed me to send invoice to this group chat.`
              );
            } catch (error) {
              console.error("Error executing query:", error);
              await darabothSendMessage(
                messageObj,
                `Wait there is an error. I'll send report to my boss @l3oth `
              );
              return ErrorReport(
                { ...messageObj, chat: { id: 485397124 } },
                error
              );
            }
          } else {
            return darabothSendMessage(
              messageObj,
              `@${messageObj.from.username} please register before using this bot.\n Here -> @DarabothBot`
            );
          }
        }
      } else {
        return darabothSendMessage(
          messageObj,
          "Hey hi, I don't know that command.🤷‍♂️ \n Ask him to make -> @l3oth"
        );
      }
    }
  }else  {
    let ismention = false;
    const condition1 = chatType == "private";
    const condition2 = (chatType == "group" || chatType == "supergroup"); // -1002369402163

    if (messageObj.entities && messageObj.entities.length > 0) {
      const mentions = messageObj.entities
        .filter((entity) => entity.type === "mention")
        .map((entity) => {
          return messageObj.text.substring(
            entity.offset,
            entity.offset + entity.length
          );
        });

      // Check if @DarabothBot is in the extracted mentions
      if (mentions.includes("@DarabothBot")) {
        ismention = true;
      }
    }
    console.log(ismention);
    console.log("Is ask for permission = ",condition2 && (Chat_ID == "-861143107") && detectAndExtractPermission(messageText));
    if (condition1 || (condition2 && ismention)) {
      if (condition2 && ismention) messageText = messageText.replace("@DarabothBot", "");

      // get chat from DB if don't have then create chat
      getChat({
        chat_id: Chat_ID,
        onSuccess: ({ results }) => {
          if (results != []) {
            chatHistory = results;
          } else {
            chatHistory = defaultChatHistory;
            saveChat({ chat_id: Chat_ID, chat_history: chatHistory, user_id: `${username}, ${first_name} ${last_name}` });
          }
        },
        onError: (response) => {
          console.log({ response });
        },
      });

      const responseText = await callAI(messageText, chatHistory);
      await templateSaveChat({
        Chat_ID,
        user_id: `${username}, ${first_name} ${last_name}`,
        chatHistory,
        messageText,
        responseText: responseText.text(),
      });
      return await darabothSendMessage(messageObj, responseText.text());
    }else if(condition2 && (Chat_ID == "-861143107") && detectAndExtractPermission(messageText)){  // 2024_B2B R&D
      // forward message when someone ask permission
      const sendUserId = [485397124,5985950554]; // Array of chat IDs to send messages to
      console.log("Workkk ",sendUserId);
      let response
      for (const chatId of sendUserId) {
        const newMessageObj = { ...messageObj, chat: { id: chatId } };
        // Send message to each chat ID
        console.log({newMessageObj});
        response = await darabothSendMessage(newMessageObj, messageObj?.text);
      }
      return response;
    }

  }

};

// This function has been moved to excelUtils.js

// These functions have been moved to excelUtils.js

async function ErrorReport(messageObj, errorMessage) {
  return await darabothSendMessage(messageObj, errorMessage);
}

// Default chat history for AI conversations
const defaultChatHistory = [
  {
    role: "user",
    parts: [{ text: personalInfo }],
  },
  {
    role: "model",
    parts: [{ text: "Great to meet you. I will remember you my boss." }],
  },
  {
    role: "user",
    parts: [{ text: friendInfo }],
  },
  {
    role: "model",
    parts: [
      { text: "Wow is that your friends? I will remember them too my boss." },
    ],
  },
  {
    role: "user",
    parts: [
      {
        text: "From now on please reply with human language. No markdown. Don't just answer the question please also ask back and be friendly! Please note that from now on Daraboth is not the one who talk with you anymore. You will act as you are Daraboth from now.",
      },
    ],
  },
  {
    role: "model",
    parts: [
      {
        text: "Yes boss. I will not reply markdown or any script or code. I will reply just human text. From now on I am Daraboth. AKA [Bros smos ler lok]",
      },
    ],
  },
];

// This section has been moved to utility modules

// This function has been moved to aiUtils.js

router.get("/getWeatherNotification", async (_, res) => {
  const payload = {
    title: "Weather Update",
    body: await getWeather(),
  };
  try {
    res.send(await sendBatchNotification(payload));
    console.log("Notification sent successfully:", payload);
  } catch (notificationError) {
    console.error("Error sending notification:", notificationError);
  }
});

router.post("/batchPush", async (req, res) => {
  const { payload } = req.body; // Extract identifier (username or deviceId) and payload from request body
  try {
    res.send(await sendBatchNotification(payload));
  } catch (error) {
    console.error("Error sending batch notifications", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/push", async (req, res) => {
  const { identifier, payload } = req.body; // Extract identifier (username or deviceId) and payload from request body
  const client = await pool.connect();

  try {
    let subscription;

    // Check if the identifier is a username or a deviceId
    const userQuery = `
      SELECT device_id FROM user_infm WHERE usernm = $1;
    `;
    const userResult = await client.query(userQuery, [identifier]);

    if (userResult.rows.length > 0) {
      // If a username is provided, retrieve the device_id from user_infm
      const { device_id } = userResult.rows[0];

      // Fetch the subscription details for the device_id
      const subscriptionQuery = `
        SELECT endpoint, expiration_time, keys FROM subscriptions WHERE device_id = $1;
      `;
      const subscriptionResult = await client.query(subscriptionQuery, [
        device_id,
      ]);

      if (subscriptionResult.rows.length > 0) {
        subscription = subscriptionResult.rows[0];
      } else {
        return res.status(404).json({
          status: false,
          message: "No subscription found for the provided username",
        });
      }
    } else {
      // If the identifier is not found in user_infm, assume it's a deviceId and fetch the subscription directly
      const subscriptionQuery = `
        SELECT endpoint, expiration_time, keys FROM subscriptions WHERE device_id = $1;
      `;
      const subscriptionResult = await client.query(subscriptionQuery, [
        identifier,
      ]);

      if (subscriptionResult.rows.length > 0) {
        subscription = subscriptionResult.rows[0];
      } else {
        return res.status(404).json({
          status: false,
          message: "No subscription found for the provided device ID",
        });
      }
    }

    // Send the notification using the fetched subscription
    sendNotification(subscription, payload, req, res);
  } catch (error) {
    console.error("Error finding subscription or sending notification", error);
    res.status(500).json({
      status: false,
      message: "Failed to send notification",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

router.get("/translateforhouyly", async (req, res) => {
  try {
    const { query } = req;
    if (query) {
      const str = query.message;
      const action = query.action || "translate";
      const targetLang = query.targetLang || "English";
      const context = query.context || "general";
      const level = query.level || "basic";

      console.log(`Request: ${str} | Action: ${action} | Target: ${targetLang} | Context: ${context}`);

      const resText = await getTranslateOrExplain(str, action, targetLang, context, level);

      res.status(200).json({
        input: str,
        translatedTo: targetLang,
        output: resText
      });
    }
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(500).json({ error: "Internal Server Error. Please try again later." });
  }
});

// This function has been moved to aiUtils.js
async function getTranslateOrExplain(str, action, targetLang, context, level) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Instruction
      ${action === "translate"
        ? `Translate the following text into ${targetLang}.
           Automatically detect the input language and translate it accurately.
           If the text cannot be translated, return "Translation not available."
           If already in ${targetLang}, return the same text.`
        : `Explain the meaning of the word or phrase in English.
           Provide a ${level} explanation focusing on ${context}.`}

      Examples:
      - "Hola, ¿cómo estás?" to English -> "Hello, how are you?"
      - "ありがとう" to English -> "Thank you."

      Text to ${action === "translate" ? "Translate" : "Explain"}
      [${str}]
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const output = response.text();

    // Fallback if the response is empty
    if (!output || output.toLowerCase().includes("not available")) {
      console.warn("Fallback triggered - No translation found.");
      return `Translation not available for: "${str}". Original text returned.`;
    }

    console.log("Response text:", output);
    return output;
  } catch (error) {
    console.error("Translation failed:", error.message);
    return `Error: Could not process the text "${str}". Please try again later.`;
  }
}

router.get("/listTranslations", authenticateToken, async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user._id;  // Get user_id from the authenticated session

    const sql = `
      SELECT id, input_text, output_text, target_language, action_type, created_at
      FROM translations
      WHERE (input_text ILIKE $1 OR output_text ILIKE $1)
      AND user_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4;
    `;

    const results = await pool.query(sql, [`%${search}%`, userId, limit, offset]);

    res.json({
      status: true,
      page,
      total: results.rowCount,
      data: results.rows
    });
  } catch (error) {
    console.error("Error listing translations:", error.message);
    res.status(500).json({ error: "Failed to fetch translations." });
  }
});

router.post("/saveTranslation", authenticateToken, async (req, res) => {
  try {
    const { input, output, targetLang, action } = req.body;
    const userId = req.user._id;  // Extract user_id from the token (after authentication)

    if (!input || !output || !targetLang || !action) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const sql = `
      INSERT INTO translations (input_text, output_text, target_language, action_type, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [input, output, targetLang, action, userId];

    const result = await pool.query(sql, values);
    res.status(201).json({
      message: "Translation saved.",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error saving translation:", error.message);
    res.status(500).json({ error: "Failed to save translation." });
  }
});

router.delete("/deleteTranslation/:id", authenticateToken, async (req, res) => {
  try {
    const translationId = req.params.id;
    const userId = req.user._id;  // Extract user_id from the authenticated session

    const sql = `
      DELETE FROM translations
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;

    const result = await pool.query(sql, [translationId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Translation not found or you don't have permission to delete it."
      });
    }

    res.json({
      message: "Translation deleted successfully.",
      deletedTranslation: result.rows[0]
    });
  } catch (error) {
    console.error("Error deleting translation:", error.message);
    res.status(500).json({ error: "Failed to delete translation." });
  }
});

router.post("/subscribe", async (req, res) => {
  const { deviceId, userAgent, subscription, userInfo } = req.body; // Extract data from request body
  console.log(deviceId, userAgent, subscription);
  const client = await pool.connect();

  try {
    const { endpoint, expirationTime, keys } = subscription; // Extract subscription details

    // Start a transaction to ensure atomicity
    await client.query("BEGIN");

    // Check if the device ID already exists in the subscriptions table
    const checkDeviceQuery = `
      SELECT 1 FROM subscriptions WHERE device_id = $1;
    `;
    const deviceExistsResult = await client.query(checkDeviceQuery, [deviceId]);

    if (deviceExistsResult.rowCount > 0) {
      // Device ID exists, update the push data only
      const updateSubscriptionQuery = `
        UPDATE subscriptions
        SET endpoint = $1,
            expiration_time = $2,
            keys = $3,
            user_agent = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE device_id = $5;
      `;

      await client.query(updateSubscriptionQuery, [
        endpoint,
        expirationTime,
        keys,
        userAgent,
        deviceId,
      ]);
    } else {
      // Device ID does not exist, insert a new subscription
      const insertSubscriptionQuery = `
        INSERT INTO subscriptions (endpoint, expiration_time, keys, device_id, user_agent, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `;

      await client.query(insertSubscriptionQuery, [
        endpoint,
        expirationTime,
        keys,
        deviceId,
        userAgent,
      ]);
    }

    if (userInfo) {
      // Update the user's device_id in the user_infm table based on the username
      const updateUserDeviceIdQuery = `
        UPDATE user_infm
        SET device_id = $1
        WHERE usernm = $2;
      `;

      // Execute the query to update the user's device_id
      await client.query(updateUserDeviceIdQuery, [deviceId, userInfo]);
    }

    // Commit the transaction after all queries succeed
    await client.query("COMMIT");

    res.json({
      status: true,
      message:
        "Subscription added/updated successfully and user device ID updated.",
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await client.query("ROLLBACK");
    console.error(
      "Error saving subscription or updating user device ID",
      error
    );
    res.status(500).json({
      status: false,
      message: "Failed to add subscription or update user device ID",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// These functions have been moved to utility modules

export default router;
