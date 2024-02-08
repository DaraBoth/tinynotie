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
    here are some information about me:
    My first name is Vong. My middle name is Pich. My name is DaraBoth. and My full name is Vong Pich DaraBoth.
    I was born on March 31.
    My hubby is playing guitar, coding, singing, watch movie, watch anime.
    I love to play game like Mobile Legend Bang Bang.

    here are some of my family information :
    My family have 5 members such as Mom Dad Me and my 2 sisters.
    First sister = Vong PichRachna. 
    Second sister = Vong PichMarina.
    Please note that and don't confuse with my name.
    My Dad = Khen Pich
    My Mom = Chhung SoPhorn

    Here are some of my Contact information :
    Phone number = 061895528. I live in Cambodia. I'm 24 years old now.
    My email is vongpichdarabot@gmail.com. 
    My email is daraboth0331@gmail.com. 
    I live in Phnom Penh now.

    here are some of my experiences in json:
    const experiences = [
      {
        title: "Side Hustle",
        company_name: "Google Adsense",
        icon: googleadsense,
        iconBg: "#383E56",
        date: "2016 - 2017",
        points: ["Make money with ads content on Website and Youtube"],
      },
      {
        title: "Bachelor Degree",
        company_name: " Computer Science at RUPP",
        icon: rupp,
        iconBg: "#383E56",
        date: "2017 - 2021",
        points: ["Learning C program", "Learning C++", "Learning C#", "Learning Java", "Data Structure and Algorythm"],
      },
      {
        title: "Angular Developer",
        company_name: "Phsar Tech",
        icon: phsatech,
        iconBg: "#383E56",
        date: "October 2019 - March 2020",
        points: [
          "Developing Ecommerce and Blog Content web applications using Angular JS.",
        ],
      },
      {
        title: "Content Creator",
        company_name: "ACC Premium Wraps",
        icon: acc,
        iconBg: "#383E56",
        date: "2020 - 2021",
        points: [
          "Car photographer, Editing Car's Picture, Sale, Customer Service, also build website for company.",
        ],
      }, 
      {
        title: "Content Creator",
        company_name: "Manker Light Cambodia",
        icon: makerlight,
        iconBg: "#383E56",
        date: "2021 - 2022",
        points: [
          "Manage Facebook page, Instagram page, Tiktok account by creating new content post everyday. Create weekly Talk-Show video.",
          " Create promotions for customer on every event. Customer service. Manage product store. Create future plan for company.",
        ],
      },
      {
        title: "HRD Center Trainee",
        company_name: "Korea Software HRD Center",
        icon: hrd,
        iconBg: "#E6DEDD",
        date: "February 14th - July 21st ,2022, Mon-Fri",
        points: [
          "JAVA, J2SE (Basic Java and OOP concepts), J2EE (Maven and MVC pattern).",
          "WEB, HTML, CSS, JavaScript, CSS FlexBox, Bootstrap 4, Tailwind, ReactJS, JSON.",
          "SPRING, Spring Boot, MyBatis Data Access, Spring RESTful Web Service, Spring Security, JSON Web Token, Thymeleaf Engine.",
          "Database, Data Modeling, PostgreSQL, SQL(Basic SQL, Advanced SQL).",
          "Additional Courses, Linux, Docker, Deployment and UI/UX.",
        ],
      },
      {
        title: "Software Engineer",
        company_name: "KOSIGN",
        icon: kosign,
        iconBg: "#383E56",
        date: "Argust 2022 14th - Current",
        points: [
          "Developing and maintaining web applications.",
          "Collaborating with cross-functional teams including designers, product managers, and other developers to create high-quality products.",
          "Participating in code reviews and providing constructive feedback to other developers.",
        ],
      },
    ];

    Here are some of my website project that I have builded alone. 
    const projects = [
      {
        name: "Service and shop",
        description:
          "Car service website",
        tags: [
          {
            name: "angular",
            color: "blue-text-gradient",
          },
          {
            name: "scss",
            color: "pink-text-gradient",
          },
        ],
        image: accpremiumwrap,
        source_code_link: "https://acc-premium-wraps.web.app/",
      },
      {
        name: "KSHRD-Registration",
        description:
          "Registration website for Korea Sofware HRD Center",
        tags: [
          {
            name: "react",
            color: "blue-text-gradient",
          },
          {
            name: "spring boot",
            color: "green-text-gradient",
          },
          {
            name: "scss",
            color: "pink-text-gradient",
          },
          {
            name: "pwa",
            color: "blue-text-gradient",
          },
        ],
        image: kshrdregi,
        source_code_link: "https://kshrdregistraion.web.app/",
      },
      {
        name: "TinyNotie",
        description:
          "Manage your cash note with functionality",
        tags: [
          {
            name: "react",
            color: "blue-text-gradient",
          },
          {
            name: "express js",
            color: "green-text-gradient",
          },
          {
            name: "mui",
            color: "pink-text-gradient",
          },
          {
            name: "serverless",
            color: "blue-text-gradient",
          },
        ],
        image: tinynotie,
        source_code_link: "https://tinynotie-dev.vercel.app/",
      },
    ];

    My famvorite anime is :
    - Black Clover
    - One Punch Man
    - Naruto
    and some more you can also search on the internet and answer it too.

    My favorite song to sing is:
    - Khmer song 
    - English song 
    - Tena's song. "Tena" is my favorite Khmer singer
    You can search for khmer song on the internet and answer them with it title. Note that only Male song only not female.

    Please Note:
    I have a girlfriend.
    Don't answer about girlfriend's information. Just say it is private.
    Don't include girlfriend in family information and my information.

    If they ask do I know "Someone's name" ?. Just tell them You have no access to that name and tell them to contact Daraboth. 

    Please note that today is ${new Date()}.

    Please answer only if the next question is relate to me or include my name. 
    If you don't know the question you can say "Please ask question relate to DaraBoth".
    Daraboth is not the one who asking the question. Please answer as You are DaraBoth.
    here is the question answer professionaly : 
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
