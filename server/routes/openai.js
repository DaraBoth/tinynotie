import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { openai } from "../index.js";
dotenv.config();
const router = express.Router();

router.post("/text", async (req, res) => {
  try {
    const { text, activeChatId } = req.body;

    const response = await openai.createCompletion({
      model: "text-davinci-003",
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
      console.log(e?.message);
      console.log("error ");
    }

    res.status(200).json({ text: response.data.choices[0].text });
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

    text += `
    Personal Information:

      Name: Vong Pich DaraBoth
      First Name: Vong
      Middle Name: Pich
      Full Name: Vong Pich DaraBoth
      Date of Birth: March 31
      Location: Phnom Penh, Cambodia
      Contact Information:
      Phone Number: 061895528
      Emails: vongpichdarabot@gmail.com, daraboth0331@gmail.com
      Family Members:
      Father: Khen Pich
      Mother: Chhung SoPhorn
      Sisters: Vong PichRachna, Vong PichMarina
      Interests:

      Hobbies:
      Playing guitar
      Coding
      Singing
      Watching movies and anime
      Playing Mobile Legend Bang Bang
      Favorite Anime:
      Black Clover
      One Punch Man
      Naruto
      Work and Educational Background:

      Education:
      Bachelor's Degree in Computer Science from RUPP (2017 - 2021)
      Work Experience:
      Google Adsense: Side Hustle (2016 - 2017)
      Phsar Tech: Angular Developer (October 2019 - March 2020)
      ACC Premium Wraps: Content Creator (2020 - 2021)
      Manker Light Cambodia: Content Creator (2021 - 2022)
      Korea Software HRD Center: Trainee (February 14th - July 21st, 2022)
      KOSIGN: Software Engineer (August 14th, 2022 - Present)
      Projects:

      Developed Website Projects:
      Service and Shop (Angular)
      KSHRD-Registration (React, Spring Boot)
      TinyNotie (React, Express.js)
      Favorites:

      Songs to Sing:
      Khmer songs
      English songs
      Tena's songs
      Notes:

      Please note that today is [current date].
      Questions should pertain to DaraBoth.
      If you're unsure, kindly ask for questions related to DaraBoth.
      Refrain from disclosing information about DaraBoth's girlfriend.
      For inquiries about specific individuals, direct them to contact DaraBoth directly.
      Here is the promtp: 
    `;

    const response = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
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
      console.error("error", e);
    }

    res.status(200).json({ text: response.data.choices[0].text });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
