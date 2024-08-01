import express from "express";
import axios from "axios";
import dotenv from "dotenv";
// import { openai } from "../index.js";
import { Configuration, OpenAIApi } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import glm from "@google-ai/generativelanguage";
import emailjs from "@emailjs/nodejs";
import moment from "moment";
import { copyFileSync } from "fs";

/* OPEN AI CONFIGURATION */
const configuration = new Configuration({
  apiKey: process.env.OPEN_API_KEY,
});
const openai = new OpenAIApi(configuration);

const genAISupporter = new GoogleGenerativeAI(process.env.API_KEY3);
const modelSupporter = genAISupporter.getGenerativeModel({
  model: "gemini-pro",
});

dotenv.config();
const router = express.Router();

const MYTOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DARABOTH_AI_TOKEN = process.env.DARABOTH_AI_TOKEN;
const baseURL = `https://api.telegram.org/bot${MYTOKEN}`;
const baseURL2 = `https://api.telegram.org/bot${DARABOTH_AI_TOKEN}`;

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

// Function Declarations for AI
const functionDeclarations = [
  {
    name: "list_users",
    description: "List all users from the database",
    parameters: {
      type: "object",
      properties: {},
    },
  },
];

// Fetch User Data from Database
async function fetchUserData() {
  try {
    const res = await dbClient.query("SELECT * FROM user_infm");
    return res.rows;
  } catch (err) {
    console.error("Error fetching user data:", err.stack);
    return [];
  }
}

// const functionResponseParts = [
//   {
//     functionResponse: {
//       name: "get_current_weather",
//       response:
//           {name: "get_current_weather", content: {weather: "super nice"}},
//     },
//   },
// ];

router.get("/text", async (req, res) => {
  try {
    let { text, random } = req.query;
    const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    const response = await result.response;
    console.log({ text });
    console.log({ res: response.text() });
    res.status(200).json({ text: response.text() });
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/text", async (req, res) => {
  try {
    const { text, activeChatId } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`${text}`);
    const response = await result.response;
    console.log({ text });
    console.log({ res: response.text() });
    // sendEmail(text, response.text());

    // try {
    //   await axios.post(
    //     `https://api.chatengine.io/chats/${activeChatId}/messages/`,
    //     { text: response.text() },
    //     {
    //       headers: {
    //         "Project-ID": process.env.PROJECT_ID,
    //         "User-Name": process.env.BOT_USER_NAME,
    //         "User-Secret": process.env.BOT_USER_SECRET,
    //       },
    //     }
    //   );
    // } catch (e) {
    //   console.log(e?.message);
    //   console.log("error ");
    // }

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

let personalInfo = `
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
- **Education**: BakTouk High School and also Kindergarten School
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
---`;

const friendInfo = `
### Friends
Friend 1:
Name: [Mean Khaw]
Phone Number: [010 7428 4635]
BIO [Fall in love with her alone, because I am introvert.]
Location: [Busan, South Korean]
Friend 2:
Name: [Ngoeun Chivorn]
Phone Number: [070 414 707]
BIO [Nothing more common than unsuccessful people with talent.]
Location: [Phnom Penh]
`;

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
        text: "From now on please reply with human language. Not markdown. Please note that from now on Daraboth is not the one who talk with you anymore. You will act as you are Daraboth from now.",
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

router.post("/ask", async (req, res) => {
  try {
    let { text, activeChatId, chatHistory } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.0-pro-001",
      tools: {
        functionDeclarations: functionDeclarations,
      },
    });

    if (!chatHistory) {
      chatHistory = defaultChatHistory;
    } else {
      if (Array.isArray(chatHistory)) {
        for (let i = defaultChatHistory.length - 1; i >= 0; i--) {
          chatHistory.unshift(defaultChatHistory[i]);
        }
      }
    }

    console.log({ chatHistory });

    const result = model.startChat({
      chatHistory: chatHistory,
      enable_automatic_function_calling:true,
      tools: [
        {
          functionDeclarations: [
            {
              name: "find_movies",
              description:
                "find movie titles currently playing in theaters based on any description, genre, title words, etc.",
              parameters: {
                type: "OBJECT",
                properties: {
                  location: {
                    type: "STRING",
                    description:
                      "The city and state, e.g. San Francisco, CA or a zip code e.g. 95616",
                  },
                  description: {
                    type: "STRING",
                    description:
                      "Any kind of description including category or genre, title words, attributes, etc.",
                  },
                },
                required: ["description"],
              },
            },
            {
              name: "find_theaters",
              description:
                "find theaters based on location and optionally movie title which is currently playing in theaters",
              parameters: {
                type: "OBJECT",
                properties: {
                  location: {
                    type: "STRING",
                    description:
                      "The city and state, e.g. San Francisco, CA or a zip code e.g. 95616",
                  },
                  movie: {
                    type: "STRING",
                    description: "Any movie title",
                  },
                },
                required: ["location"],
              },
            },
            {
              name: "get_showtimes",
              description:
                "Find the start times for movies playing in a specific theater",
              parameters: {
                type: "OBJECT",
                properties: {
                  location: {
                    type: "STRING",
                    description:
                      "The city and state, e.g. San Francisco, CA or a zip code e.g. 95616",
                  },
                  movie: {
                    type: "STRING",
                    description: "Any movie title",
                  },
                  theater: {
                    type: "STRING",
                    description: "Name of the theater",
                  },
                  date: {
                    type: "STRING",
                    description: "Date for requested showtime",
                  },
                },
                required: ["location", "movie", "theater", "date"],
              },
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 100,
      },
    });

    const chat = await result.sendMessage(text);

    // For simplicity, this uses the first function call found.
    // const call = result.response.functionCalls()[0];

    // if (call) {
    //   // Call the executable function named in the function call
    //   // with the arguments specified in the function call and
    //   // let it call the hypothetical API.
    //   const apiResponse = await functions[call.name](call.args);

    //   // Send the API response back to the model so it can generate
    //   // a text response that can be displayed to the user.
    //   const result = await chat.sendMessage([
    //     {
    //       functionResponse: {
    //         name: "list_users",
    //         response: apiResponse,
    //       },
    //     },
    //   ]);

    //   // Log the text response.
    //   console.log(result.response.text());
    //   const response = await result.response;
    //   console.log("response: ", JSON.stringify(response));
    //   sendEmail(text, response.text());

    //   res.status(200).json({ text: response.text() });
    // } else {
      const response = await chat.response;
      console.log("response: ", JSON.stringify(response));
      sendEmail(text, response.text());

      res.status(200).json({ text: response.text() ,response});
    // }
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
        if (JSONData._tran_req_data) {
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
