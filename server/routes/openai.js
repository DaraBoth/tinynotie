import express, { response } from "express";
import axios from "axios";
import dotenv from "dotenv";
// import { openai } from "../index.js";
import { Configuration, OpenAIApi } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import glm from "@google-ai/generativelanguage";
import emailjs from "@emailjs/nodejs";
import moment from "moment";
import pg from "pg";
const Pool = pg.Pool;
import { Telegraf } from "telegraf";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// const pool = new Pool({
//   user: "kjjelxjh",
//   host: "chunee.db.elephantsql.com",
//   database: "kjjelxjh",
//   password: "lfrM5dzzIODpETfrSmRskIGZ-W8kAeg-",
//   port: 5432,
// });

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
const DARABOTH_AI_TOKEN = process.env.TELEGRAM_BOT_TOKEN3;
const Bizweb_report_bot = process.env.BIZWEB_REPORT_BOT;
const baseURL = `https://api.telegram.org/bot${MYTOKEN}`;
const baseURL2 = `https://api.telegram.org/bot${DARABOTH_AI_TOKEN}`;
// const baseURL3 = `https://api.telegram.org/bot${Bizweb_report_bot}`;
const Bizweb_bot = new Telegraf(Bizweb_report_bot);
// const DARABOTH_AI = new Telegraf(DARABOTH_AI_TOKEN);

Bizweb_bot.start((ctx) => {
  ctx.reply(
    "Welcome to your Telegram bot! Use /help to see available commands."
  );
});

Bizweb_bot.help((ctx) => {
  ctx.reply("Available commands:\n/newarticle - Create a new article");
});

Bizweb_bot.command("newarticle", (ctx) => {
  ctx.reply("Please enter the title of your article:");
  Bizweb_bot.on("text", async (ctx) => {
    const title = ctx.message.text;
    ctx.reply("Please enter the content of your article:");
    Bizweb_bot.on("text", async (ctx) => {
      const content = ctx.message.text;

      // Call a function to create the article using the title and content
      createArticle(ctx, title, content);
    });
  });
});

async function createArticle(ctx, title, content) {
  // Here you would make a request to the Telegraph API to create the article
  // For now, let's just log the title and content
  console.log("Title:", title);
  console.log("Content:", content);

  ctx.reply("Article created successfully! "+title+content);
}

Bizweb_bot.launch();

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

const AxiosTelegramBotInstance2 = {
  get(method, params) {
    return axios.get(`/${method}`, {
      baseURL: baseURL2,
      params,
    });
  },
  post(method, data) {
    return axios({
      method: "POST",
      baseURL: baseURL2,
      url: `/${method}`,
      data,
    });
  },
};


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
    // res.status(200).json({ text: response.text() });
    res.status(200).json({
      text: "My name is Daraboth. May I ask who are you? Please reply in my AskMore tap.",
    });
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

router.post("/askDatabase", async (req, res) => {
  try {
    const { userAsk } = req.body;

    const responseData = await AI_Database(userAsk, []);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

const dataBaseSchema = `Database Schema
    Please adhere strictly to the following schema when generating SQL queries:

    Table Name: Users
    Columns:
    user_id (INT, AUTO_INCREMENT, PRIMARY KEY)
    name (VARCHAR(255))
    email (VARCHAR(255), UNIQUE)
    phone (VARCHAR(20))
    created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

    Table Name: Categories
    Columns:
    category_id (INT, AUTO_INCREMENT, PRIMARY KEY)
    category_name (VARCHAR(50))
    description (VARCHAR(255))

    Table Name: Currencies
    Columns:
    currency_code (VARCHAR(3), PRIMARY KEY) -- ISO 4217 currency code like 'USD', 'KRW', 'KHR'
    currency_name (VARCHAR(50), NOT NULL)

    Table Name: Transactions
    Columns:
    transaction_id (INT, SERIAL, PRIMARY KEY)
    user_id (INT, FOREIGN KEY REFERENCES Users(user_id))
    category_id (INT, FOREIGN KEY REFERENCES Categories(category_id))
    amount (DECIMAL(10, 2), NOT NULL)
    currency_code (VARCHAR(3), FOREIGN KEY REFERENCES Currencies(currency_code))
    description (VARCHAR(255))
    transaction_date (DATE, NOT NULL)
    created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

    Table Name: BorrowLend
    Columns:
    borrow_lend_id (INT, AUTO_INCREMENT, PRIMARY KEY)
    transaction_id (INT, FOREIGN KEY REFERENCES Transactions(transaction_id))
    borrower_id (INT, FOREIGN KEY REFERENCES Users(user_id))
    lender_id (INT, FOREIGN KEY REFERENCES Users(user_id))
    due_date (DATE)
    status (ENUM('Pending', 'Paid'), DEFAULT 'Pending')

    Table Name: Purchases
    Columns:
    purchase_id (INT, AUTO_INCREMENT, PRIMARY KEY)
    transaction_id (INT, FOREIGN KEY REFERENCES Transactions(transaction_id))
    item_name (VARCHAR(255))
    quantity (INT, DEFAULT 1)
    unit_price (DECIMAL(10, 2))
    total_price (DECIMAL(10, 2))

    Table Name: Payments
    Columns:
    payment_id (INT, AUTO_INCREMENT, PRIMARY KEY)
    borrow_lend_id (INT, FOREIGN KEY REFERENCES BorrowLend(borrow_lend_id))
    payment_amount (DECIMAL(10, 2))
    payment_date (DATE)

    Use this schema to generate accurate SQL queries based on the user's input. Ensure that the SQL queries are compatible with PostgreSQL version 12 or earlier.
`;

async function AI_Database(userAsk, chatHistory = []) {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
  const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-001" });

  const prompt = `
    Instruction:
    You are tasked with analyzing user input and generating a complex SQL solution for an SQLite database. Your response must always be in JSON format with the following fields:

    sqlType: A string indicating the type of SQL operation. If only one type (e.g., SELECT), return it directly. If multiple operations are needed, return "MORE".
    sql: A complete SQL solution that addresses the user's request. This can include:
    Multiple SQL statements.
    Complex SQL structures such as subqueries or common table expressions (CTEs).
    SQL that combines different operations to achieve the desired output.
    Ensure that the SQL solution is compatible with SQLite, formatted as a single block of text without line breaks.
    executable: Boolean indicating whether the SQL solution can be executed directly (true for executable, false for non-executable or irrelevant input).
    responseMessage: Additional context or feedback to the user, including explanations for complex logic.
    Additional Instructions:

    Complex Queries: Generate SQL that can handle multifaceted user requests, such as combining information from multiple tables, performing calculations, and using advanced SQL features like CTEs or window functions.
    Dynamic Handling: If a single SQL query is insufficient, break the task into multiple SQL statements or use functions to encapsulate complex logic.
    Currency Handling: Although SQLite does not have a native currency type, ensure that the SQL solution correctly handles currency codes as text and numeric values as appropriate.
    
    ${dataBaseSchema}

    Validation Process:
    Schema Adherence: Ensure the SQL solution references only the columns and tables defined in the provided schema.
    SQL Compatibility: Verify that the SQL syntax is compatible with SQLite.
    Syntax Check: Ensure that each SQL statement in the solution has correct syntax and will not result in errors.
    Contextual Relevance: Ensure the SQL solution accurately reflects the user’s request; return a relevant message and set executable to false if not possible.

    Examples of Desired Output:

    User Input: "I want to know how much I spent from last month until now, and what I spent the money on?"
    AI JSON Response:
    {
        "sqlType": "SELECT",
        "sql": "WITH MonthlySpending AS (SELECT SUM(amount) AS total_spent, currency_code FROM Transactions WHERE transaction_date >= date('now', '-1 month') GROUP BY currency_code), SpendingDetails AS (SELECT T.amount, T.currency_code, T.description, C.category_name FROM Transactions T JOIN Categories C ON T.category_id = C.category_id WHERE T.transaction_date >= date('now', '-1 month')) SELECT MS.total_spent, SD.currency_code, SD.description, SD.category_name FROM MonthlySpending MS JOIN SpendingDetails SD ON MS.currency_code = SD.currency_code;",
        "executable": true,
        "responseMessage": "This query provides your total spending from last month until now, including what the money was spent on."
    }

    User Input: "How much did I spend in the last month, broken down by category?"
    AI JSON Response:
    {
        "sqlType": "SELECT",
        "sql": "SELECT C.category_name, SUM(T.amount) AS total_spent, Cur.currency_code FROM Transactions T JOIN Categories C ON T.category_id = C.category_id JOIN Currencies Cur ON T.currency_code = Cur.currency_code WHERE strftime('%Y-%m', T.transaction_date) = strftime('%Y-%m', date('now', '-1 month')) GROUP BY C.category_name, Cur.currency_code;",
        "executable": true,
        "responseMessage": "This query breaks down your spending over the last month by category."
    }

    Guidelines:
    Generate complex SQL solutions that may involve multiple steps or operations.
    Ensure all SQL statements are compatible with SQLite.
    Validate SQL syntax before including it in the JSON response.
    Use the provided schema to generate accurate and relevant SQL queries.
    Always format SQL queries as a single block of text.
    Ensure the SQL solution includes both the total amount spent and the currency. Handle currency codes as text and numeric values as appropriate.

    Text to Analyze
    [${userAsk}]
    `;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  const cleanedResponse = response.text().replace(/```json|```/g, "");

  const jsonData = JSON.parse(cleanedResponse);
  console.log(jsonData);

  let sqlQuery = jsonData.sql;
  console.log(sqlQuery);

  const responseData = {
    AI_Answer: jsonData,
    status: "",
    executeStatus: true,
    data: [],
    message: "",
  };

  if (jsonData["executable"] == true || jsonData["executable"] == "true") {
    // validate first
    if (sqlQuery.includes('"')) sqlQuery = sqlQuery.replace('"', '"');
    if (sqlQuery.includes(" n")) sqlQuery = sqlQuery.replace(" n", " ");
    if (sqlQuery.includes("\n")) sqlQuery = sqlQuery.replace("\n", " ");
    if (Array.isArray(jsonData.sqlType)) jsonData.sqlType = jsonData.sqlType[0];

    try {
      const results = await pool.query(sqlQuery);

      switch (jsonData.sqlType) {
        case "MORE":
        case "SELECT":
          responseData.data = results.rows;

          const prompt = `
            User Ask For: [${userAsk}]
            Database Response: [${JSON.stringify(results.rows)}]
          `;

          const resText = await AI_Human_readble(prompt, chatHistory);
          responseData.message = resText.text();

          break;
        default:
          console.log(results);
          responseData.message = `${jsonData["sqlType"]} is success!`;
          break;
      }
    } catch (error) {
      console.error("Error executing query:", error);
      responseData.status = `Error Pool : ${error}`;
      responseData.executeStatus = false;
    }
  } else if (
    jsonData["executable"] == "false" ||
    jsonData["executable"] == false
  ) {
    responseData.executeStatus = false;
    responseData.message = jsonData["responseMessage"];
  }

  return responseData;
}

async function AI_Human_readble(prompt, chatHistory) {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.0-pro-001",
  });

  const template = `
        Instruction
        You are tasked with generating a human-readable text response based on the following parameters:

        User Ask For: This is what the user is asking for in natural language.
        Database Response: This is the data returned from the database, provided in JSON format or as an array. The data might sometimes be empty.
        Your job is to interpret the database response and craft a natural, human-like message that answers the user's query based on the available data. If the database response is empty or does not contain the requested information, politely inform the user.

        Examples of Desired Output
        User Ask For: "Can you show me the details of the last order?"
        Database Response:

        json
        Copy code
        {
            "order_id": 12345,
            "user_id": 6789,
            "product_name": "Wireless Mouse",
            "order_date": "2024-08-01"
        }
        AI Response:
        "The details of the last order are as follows: Order ID 12345, for a Wireless Mouse, placed on August 1, 2024."

        User Ask For: "Do we have any recent sign-ups?"
        Database Response: []
        AI Response:
        "It seems there are no recent sign-ups at the moment."

        User Ask For: "What is the total revenue?"
        Database Response:

        json
        Copy code
        {
            "total_revenue": 45000
        }
        AI Response:
        "The total revenue currently stands at $45,000."

        User Ask For: "Show me all user info."
        Database Response:

        json
        Copy code
        [
            {"id": 1, "name": "John Doe", "email": "john@example.com"},
            {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
        ]
        AI Response:
        "Here are the details of all users: 1. John Doe (john@example.com), 2. Jane Smith (jane@example.com)."

        User Ask For: "What is your name?"
        Database Response: null
        AI Response:
        "I'm an AI assistant, so I don't have a name. How can I assist you today?"

        Guidelines
        Use the data from the "Database Response" to generate a clear and concise human-readable message that directly answers the user's query.
        If the database response is empty, politely inform the user that the requested data is not available.
        Ensure the response is natural, polite, and appropriate for a professional setting.`;

  const defaultChatHistory = [
    {
      role: "user",
      parts: [{ text: template }],
    },
    {
      role: "model",
      parts: [{ text: "Yes noted boss." }],
    },
  ];

  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    for (let i = defaultChatHistory.length - 1; i >= 0; i--) {
      chatHistory.unshift(defaultChatHistory[i]);
    }
  } else {
    chatHistory = defaultChatHistory;
  }

  const result = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 250,
    },
  });

  const chat = await result.sendMessage(prompt);
  return chat.response;
}

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
    const response = await callAI(text, chatHistory);
    console.log("response: ", response);
    sendEmail(text, response.text());
    res.status(200).json({ text: response.text() });
    // }
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
      // console.log(messageObj);
      await handleMessage(messageObj);
      res.status(200).json({ response: req.body });
    }
  } catch (error) {
    console.log(error);
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/sendMessage", async (req, res) => {
  try {
    const data = req.body.data; // Get the data object from the request body
    console.log("Received data:", data);

    const messageObj = {
      chat: {
        id: 485397124,
      },
    };

    let resText = await getCleaningProm(data, "Who is cleaning this week?");
    darabothSendMessage(messageObj, resText);

    res.status(200).send("Data received successfully");
  } catch (error) {
    console.error("Error parsing JSON:", error);
    res.status(500).send("Error processing data");
  }
});

async function getCleaningProm(data, msg) {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
  const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-001" });
  const prompt = `
      This data is about cleaning schedule in a house.
      And it's a trigger when there is change updated in excel.
      The number is refer to their step one after another. 
      The number if it meet the last index it will go back to the first person.
      THe memberName is the house member's name.
      Look to the array in each object the "isTurnToClean" key is there turn to clean.
      So answer to the question depend on the user want.
      Here is this week date = ${new Date()}

      Here is the data in JSON :
      ${JSON.stringify(data)}
      
      Here is the user request:
      ${msg}

      Please response back to user as report text.
      `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  console.log("response text : " + response.text());

  return response.text();
}

async function getTranslate(str) {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
  const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-001" });
  const prompt = `
      Instruction
      Translate the following English text into Korean using a highly polite and formal tone, suitable for communication with managers, team leaders, and coworkers. The translation should reflect respect and professionalism, similar to the style used in the examples provided.

      Examples
      English: "Development has been completed. Please test."
      Korean: "개발 완료 되었습니다. 테스트 부탁드립니다."

      English: "The requested data has been shared."
      Korean: "요청하신 데이터 공유드립니다."

      English: "The part you shared has been corrected."
      Korean: "공유해주신 부분 수정되었습니다."

      English: "Applied to the development."
      Korean: "개발계 적용되었습니다."

      English: "Please confirm after the corrections have been made."
      Korean: "수정완료 했습니다. 확인 부탁드립니다."

      English: "Hello [Title/Name]. Do you have a moment?"
      Korean: "안녕하세요, [직책 이름]님. 잠시 시간 내주실 수 있으실까요?"

      English: "I've been reviewing the data logic and SQL queries, but some of the logical structures aren't quite clear to me."
      Korean: "제가 이번 데이터 로직과 SQL 쿼리 부분을 검토하고 있는데, 일부 논리 구조가 명확하지 않은 것 같습니다."

      English: "Specifically, with [specific part or query], I'm not sure what logic should be applied. Could you explain how to approach this part?"
      Korean: "특히, [specific part or query] 부분에서 어떤 논리를 적용해야 할지 잘 모르겠습니다. 이 부분에 대해 설명해 주실 수 있으신가요?"

      English: "Thank you for your help. I'll try again based on your guidance."
      Korean: "도와주셔서 대단히 감사합니다. 알려주신 내용을 바탕으로 다시 시도해 보겠습니다."

      Text to Translate
      [${str}]
      `;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  console.log("response text : " + response.text());

  return response.text();
}

async function getCleaningData() {
  // The URL of your Google Apps Script API
  const apiUrl =
    "https://script.googleusercontent.com/macros/echo?user_content_key=9Ovb5GOK5_AzG_J5F4vZevLD1BJUHGBDOy4f5aRPnLWsRfk--3E3D2RRmKQT1v7yDu8JWId5KVOpqqhu4Qj-_irNgX_4yipGm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnH0F3hTo8--0NaCjX14wIwYF8cC0JS_Qnf8nhHxq_fatmaA3v2xa3l1a5JW_7uN3odVGcm-yqcxT-eXcEBicvLoqH09rX9KD8dz9Jw9Md8uu&lib=MgKmp91GXkA9SSJzubbc_qu8MXP5Cr7Q7";

  // Make the API call using axios
  const response = await axios.get(apiUrl);
  return response.data;
}

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

const darabothSendMessage = function (messageObj, messageText) {
  return AxiosTelegramBotInstance2.get("sendMessage", {
    chat_id: messageObj.chat.id || "",
    text: messageText,
  });
};

const runQuery = async ({ sql, values }) => {
  console.log({ sql });
  return new Promise((resolve, reject) => {
    try {
      pool.query(sql, values, (error, results) => {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          console.log("sql was a success");
          resolve(results);
        }
      });
    } catch (error) {
      console.error("Error executing query:", error);
      reject(error);
    }
  });
};

const saveChat = async ({ chat_id, chat_history }) => {
  const sql = `
    INSERT INTO json_data (chat_id, chat_history)
    VALUES ($1, $2)
    ON CONFLICT (chat_id)
    DO UPDATE SET
      chat_history = EXCLUDED.chat_history;
  `;
  const values = [chat_id, JSON.stringify({ chat: chat_history })];

  try {
    await runQuery({ sql, values });
    return { isError: false, reason: "" };
  } catch (error) {
    // console.error(error);
    return { isError: true, reason: error.message };
  }
};

const getChat = async function ({
  chat_id,
  onSuccess = function () {},
  onError = function () {},
}) {
  const sql = ` select id, chat_id, chat_history from json_data where chat_id = $1 ; `;
  const response = {
    isError: false,
    results: [],
    reason: "",
  };
  const values = [chat_id];
  runQuery({ sql, values })
    .then((res) => {
      response.isError = false;
      if (res && res?.rowCount) {
        if (res.rowCount >= 1) {
          const his = res.rows[0].chat_history;
          response.results = his.chat;
          onSuccess(response);
        } else {
          response.results = [];
          onSuccess(response);
        }
      }
    })
    .catch((err) => {
      response.isError = true;
      response.reason = err;
      onError(response);
    });
};

const handleMessage = async function (messageObj) {
  if (!messageObj) return;
  const { id: Chat_ID } = messageObj?.chat;
  let messageText = messageObj?.text + "" || "";
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

  switch (Chat_ID) {
    case -406610085: // Family
    case -1001754103737: // BTB Class
      if (messageText.startsWith("/ask")) {
        const responseText = await callAI(messageText, chatHistory);
        templateSaveChat({
          Chat_ID,
          chatHistory,
          messageText,
          responseText: responseText.text(),
        });
        return darabothSendMessage(messageObj, responseText.text());
      }
      break;
    default:
      if (messageText.charAt(0) == "/") {
        const command = messageText.slice(1);
        if (command.includes("start")) {
          return darabothSendMessage(messageObj, "Hi! bro");
        } else if (command.includes("whoclean")) {
          const cleaningData = await getCleaningData();
          const resText = await getCleaningProm(
            cleaningData,
            command.replace("whoclean", "who clean")
          );
          return darabothSendMessage(messageObj, resText);
        } else if (command.includes("translate")) {
          const resText = await getTranslate(command.replace("translate", ""));
          return darabothSendMessage(messageObj, resText);
        } else {
          return darabothSendMessage(
            messageObj,
            "Hey hi, I don't know that command."
          );
        }
      } else {
        const responseText = await callAI(messageText, chatHistory);
        templateSaveChat({
          Chat_ID,
          chatHistory,
          messageText,
          responseText: responseText.text(),
        });
        return darabothSendMessage(messageObj, responseText.text());
      }
  }
};

function templateSaveChat({ Chat_ID, chatHistory, messageText, responseText }) {
  if (Array.isArray(chatHistory)) {
    chatHistory.push({ role: "user", parts: [{ text: messageText }] });
    chatHistory.push({
      role: "model",
      parts: [{ text: responseText }],
    });
  }
  saveChat({ chat_id: Chat_ID, chat_history: chatHistory });
}

async function callAI(text, chatHistory) {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.0-pro-001",
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

  const result = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 250,
    },
  });

  const chat = await result.sendMessage(text);
  return chat.response;
}

export default router;
