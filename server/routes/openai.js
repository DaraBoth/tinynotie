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
const pool = new Pool({
  user: "kjjelxjh",
  host: "chunee.db.elephantsql.com",
  database: "kjjelxjh",
  password: "lfrM5dzzIODpETfrSmRskIGZ-W8kAeg-",
  port: 5432,
});

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

    const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-001" });

    const prompt = `
    Instruction
    You are tasked with analyzing user input to determine if it should generate a SQL query. Your response must always be in JSON format, containing the following fields:

    sqlType: The type of SQL operation (e.g., SELECT, INSERT, UPDATE, DELETE, CREATE).
    sql: The SQL query that should be executed based on the user input.
    executable: A boolean indicating whether the SQL query can be executed (true for executable, false for non-executable or irrelevant input).
    responseMessage: A message to provide additional context or feedback to the user. If the input is not relevant to the database (e.g., a personal question), include an appropriate response in this field and leave sqlType and sql empty.
    Database Schema
    The database schema is defined as follows:

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

    Table Name: Transactions
    Columns:
    transaction_id (INT, AUTO_INCREMENT, PRIMARY KEY)
    user_id (INT, FOREIGN KEY REFERENCES Users(user_id))
    category_id (INT, FOREIGN KEY REFERENCES Categories(category_id))
    amount (DECIMAL(10, 2))
    description (VARCHAR(255))
    transaction_date (DATE)
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

    Use this schema to generate accurate SQL queries based on the user's input.

    Examples of Desired Output
    User Input: "I want to see all user info."
    AI JSON Response:

    json
    Copy code
    {
        "sqlType": "SELECT",
        "sql": "select * from Users;",
        "executable": "true",
        "responseMessage": ""
    }
    User Input: "Add a new user with name John."
    AI JSON Response:

    json
    Copy code
    {
        "sqlType": "INSERT",
        "sql": "insert into Users (name) values ('John');",
        "executable": "true",
        "responseMessage": ""
    }
    User Input: "What is your name?"
    AI JSON Response:

    json
    Copy code
    {
        "sqlType": "",
        "sql": "",
        "executable": "false",
        "responseMessage": "Sorry I am just a Database, I don't have a name."
    }
    User Input: "Delete the user with ID 5."
    AI JSON Response:

    json
    Copy code
    {
        "sqlType": "DELETE",
        "sql": "delete from Users where id = 5;",
        "executable": "true",
        "responseMessage": ""
    }
    Guidelines
    If the user input is a valid request for database action (e.g., SELECT, INSERT, UPDATE, DELETE, CREATE), identify the sqlType and generate the corresponding SQL query using the provided schema.
    If the user input does not pertain to database actions or cannot be processed as an SQL command, return a responseMessage explaining the situation, and set executable to false.
    Ensure that the response is always well-formed JSON with the correct fields.
    Text to Analyze
    [${userAsk}]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const cleanedResponse = response.text().replace(/```json|```/g, "");

    const jsonData = JSON.parse(cleanedResponse);
    console.log(jsonData);

    const sqlQuery = jsonData.sql;
    console.log(sqlQuery); 

    const responseData = {
      AI_Answer: jsonData,
      status : "",
      executeStatus: true,
      data :  [],
      message : ""
    }

    if(jsonData["executable"] == "true"){
      try {
        pool.query(sqlQuery, (error, results) => {
          if (error) {
            console.log(error);
            responseData.executeStatus = false;
            responseData.status = `Error SQL : ${error}`
          } else {
            switch (jsonData["sqlType"]) {
              case "SELECT":
                if(results.rowCount > 0){
                  responseData.data = results.rows;
                }      
                break;
              default:
                responseData.message = `${jsonData["sqlType"]} is success!`
                break;
            }
          }
        });
      } catch (error) {
        console.error("Error executing query:", error);
        responseData.status = `Error Pool : ${error}`
        responseData.executeStatus = false;
      }

    }else if(jsonData["executable"] == "false"){
      responseData.executeStatus == false;
      responseData.message = jsonData["responseMessage"]
    }
    
    res.status(200).json(responseData);
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
