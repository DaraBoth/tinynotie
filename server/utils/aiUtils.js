import { GoogleGenerativeAI } from "@google/generative-ai";
import moment from "moment";
import axios from "axios";

/**
 * Call the AI model with a message and chat history
 * @param {string} text - The message to send to the AI
 * @param {Array} chatHistory - The chat history
 * @param {Array} defaultChatHistory - The default chat history to use if none is provided
 * @returns {Promise} - A promise that resolves with the AI response
 */
export const callAI = async (text, chatHistory, defaultChatHistory = []) => {
  let genAI = null, model = null;
  
  // Try different API keys in case one fails
  try {
    genAI = new GoogleGenerativeAI(process.env.API_KEY2);
    model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    console.log("Using API_KEY2");
  } catch(e) {
    console.log(e);
    try {
      genAI = new GoogleGenerativeAI(process.env.API_KEY3);
      model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      console.log("Using API_KEY3");
    } catch(e) {
      console.log(e);
      genAI = new GoogleGenerativeAI(process.env.API_KEY);
      model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      console.log("Using API_KEY");
    }
  }
  
  // Initialize chat history if not provided
  if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
    chatHistory = [...defaultChatHistory];
  } else {
    // Prepend default chat history to the provided chat history
    // Make a deep copy to avoid modifying the original
    const combinedHistory = [...defaultChatHistory];
    
    // Add the user's chat history after the default history
    for (const message of chatHistory) {
      if (!defaultChatHistory.some(m => 
        m.role === message.role && 
        m.parts[0]?.text === message.parts[0]?.text
      )) {
        combinedHistory.push(message);
      }
    }
    
    chatHistory = combinedHistory;
  }

  // Start a chat with the AI
  const result = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 250,
    },
  });

  // Send the message and get the response
  const chat = await result.sendMessage(text);
  return chat.response;
};

/**
 * Get a human-readable response from the AI based on database results
 * @param {string} prompt - The prompt to send to the AI
 * @param {Array} chatHistory - The chat history
 * @returns {Promise} - A promise that resolves with the AI response
 */
export const AI_Human_readable = async (prompt, chatHistory = []) => {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
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
    {
        "total_revenue": 45000
    }
    AI Response:
    "The total revenue currently stands at $45,000."

    User Ask For: "Show me all user info."
    Database Response:
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

  // Combine the default chat history with the provided chat history
  let combinedHistory;
  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    combinedHistory = [...defaultChatHistory, ...chatHistory];
  } else {
    combinedHistory = defaultChatHistory;
  }

  const result = model.startChat({
    history: combinedHistory,
    generationConfig: {
      maxOutputTokens: 250,
    },
    maxTokens: 150,
    temperature: 0.7,
  });

  const chat = await result.sendMessage(prompt);
  return chat.response;
};

/**
 * Query the AI for database operations
 * @param {string} userAsk - The user's question
 * @param {string} userAskID - The user's ID
 * @param {Array} chatHistory - The chat history
 * @returns {Promise} - A promise that resolves with the AI response
 */
export const AI_Database = async (userAsk, userAskID, chatHistory = []) => {
  const genAI = new GoogleGenerativeAI(process.env.API_KEY2);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  Instruction:
  You are tasked with analyzing user input and generating a complex SQL solution for a PostgreSQL database. Your response must always be in JSON format with the following fields:

  sqlType: A string indicating the type of SQL operation. If the operation is a simple one (e.g., SELECT, INSERT), return it directly. If multiple operations are needed, return "MORE".
  sql: A complete SQL solution that addresses the user's request. This can include:
  - Multiple SQL statements.
  - Complex SQL structures such as subqueries or common table expressions (CTEs).
  - SQL that combines different operations to achieve the desired output.
  Ensure that the SQL solution is compatible with PostgreSQL, formatted as a single block of text without line breaks.
  executable: Boolean indicating whether the SQL solution can be executed directly (true for executable, false for non-executable or irrelevant input).
  responseMessage: Additional context or feedback to the user, including explanations for complex logic or action taken (e.g., "Record inserted successfully" or "Access denied").

  Additional Instructions:

  Complex Queries: Generate SQL that can handle multifaceted user requests, such as combining information from multiple tables, performing calculations, and using advanced SQL features like CTEs or window functions.
  Dynamic Handling: If a single SQL query is insufficient, break the task into multiple SQL statements or use functions to encapsulate complex logic.
  Currency Handling: Although PostgreSQL does not have a native currency type, ensure that the SQL solution correctly handles currency codes as text and numeric values as appropriate.
  
  Authorization Checks: Use the user_infm table to verify if the user has the required permissions. For example, if a user requests data for a group, ensure they are the admin or have the necessary permissions to access that group's data. If the usernm (username) provided does not match the admin of the requested group, do not allow access.

  Handling Insert Operations: When generating SQL that involves an INSERT operation, ensure the response 'sqlType' is set to "INSERT". Include a clear responseMessage that indicates whether the insertion was successful or if there was an error (e.g., "Record inserted successfully" or "You do not have permission to insert records in this table").

  **Default Date Handling**: If a user does not provide a specific date when they want to create a record (e.g., "create_date"), automatically use the current date (CURRENT_DATE in PostgreSQL) as the default value for the creation.

  Provided Data:
  usernm: '${userAskID}'  -- This username should be used to filter data related to the user in the relevant tables.

  Database Schema and Usage Guide:
  
  Table Name: user_infm
  Purpose: This table stores user-related information and is primarily used for authentication, user management, and authorization checks.
  Columns:
  - id (SERIAL, PRIMARY KEY): An auto-incrementing integer that uniquely identifies each user.
  - usernm (VARCHAR(50), NOT NULL): Stores the username of the user. This is used for user authentication, login, and identifying the group admin.
  - passwd (VARCHAR(150), NOT NULL): Stores the hashed password of the user. This is used for secure login and authentication.
  - phone_number (VARCHAR(30)): Stores the phone number of the user (optional). Used for contact and recovery purposes.
  - email (VARCHAR(30)): Stores the email address of the user (optional). Used for notifications and account recovery.
  - profile_url (VARCHAR(260)): Stores the URL of the user's profile picture or page (optional).
  - create_date (VARCHAR(25)): Stores the date and time when the user account was created.

  Important Notes:
  - **Use Case**: This table should only be used when dealing with operations involving real user actions, such as who created a group, who owns a group, who has administrative rights, etc.
  - **Do Not Use for**: Finding group members, their payments, or their participation in groups or trips. For those, use 'member_infm'.

  Table Name: grp_infm
  Purpose: This table stores information about different groups created by users. It is used to manage group-related activities and metadata.
  Columns:
  - id (SERIAL, PRIMARY KEY): An auto-incrementing integer that uniquely identifies each group.
  - grp_name (VARCHAR(50), NOT NULL): Stores the name of the group.
  - status (INT, DEFAULT NULL): Stores the status of the group (e.g., active, inactive).
  - description (VARCHAR(260), DEFAULT NULL): Stores a description of the group (optional).
  - admin_id (INT, DEFAULT NULL): References the ID of the group's administrator, linking to the user_infm table.
  - create_date (VARCHAR(25), DEFAULT NULL): Stores the date and time when the group was created.
  - currency (VARCHAR(10), NOT NULL, DEFAULT '$'): Stores the currency code or symbol used within the group.
  - visibility (VARCHAR(10), NOT NULL, DEFAULT 'private'): Stores the visibility status of the group ('public' or 'private').

  Important Notes:
  - **Use Case**: This table is used to define group attributes and the admin who manages the group. It is related to high-level group information.
  - **Do Not Use for**: Tracking individual user payments or membership details. 

  Table Name: trp_infm
  Purpose: This table stores information about trips associated with groups. It is used to manage trip-related data, including expenses and member participation.
  Columns:
  - id (SERIAL, PRIMARY KEY): An auto-incrementing integer that uniquely identifies each trip.
  - trp_name (VARCHAR(50), NOT NULL): Stores the name of the trip.
  - spend (FLOAT, DEFAULT NULL): Stores the amount of money spent on the trip.
  - mem_id (VARCHAR(260), DEFAULT NULL): Stores a serialized array of member IDs who participated in the trip.
  - status (INT): Stores the status of the trip (e.g., planned, completed).
  - description (VARCHAR(260)): Stores additional information about the trip (optional).
  - group_id (INT, DEFAULT NULL): References the ID of the group that organized the trip, linking to the grp_infm table.
  - create_date (VARCHAR(25), DEFAULT NULL): Stores the date and time when the trip was created.
  - update_dttm (VARCHAR(25)): Stores the date and time when the trip was last updated (optional).

  Important Notes:
  - **Use Case**: Manages trip-related data within groups, including total spending and participating members.
  - **Do Not Use for**: Checking group creation or administrative tasks; this table is purely about trip management.

  Table Name: member_infm
  Purpose: This table stores information about members in groups and tracks their financial contributions (payments) within groups.
  Columns:
  - id (SERIAL, PRIMARY KEY): An auto-incrementing integer that uniquely identifies each member.
  - mem_name (VARCHAR(50), NOT NULL): Stores the name of the member. This could be a username or a real name.
  - paid (FLOAT, DEFAULT NULL): Stores the amount of money the member has paid or contributed.
  - group_id (INT, DEFAULT NULL): References the ID of the group that the member belongs to, linking to the grp_infm table.

  Important Notes:
  - **Use Case**: This table is specifically for tracking payments and membership in groups. If you need to find out how much a member paid within a group or who the members of a group are, this is the table to use.
  - **Do Not Use for**: Authenticating or validating real user identities; this is not tied to 'user_infm'.

  Table Name: grp_users
  Purpose: This table stores the relationship between users and groups, specifying which users can view specific groups.
  Columns:
  - id (SERIAL, PRIMARY KEY): An auto-incrementing integer that uniquely identifies each record.
  - group_id (INT, NOT NULL): References the ID of the group, linking to the grp_infm table.
  - user_id (INT, NOT NULL): References the ID of the user, linking to the user_infm table.
  - can_view (BOOLEAN, DEFAULT FALSE): Indicates whether the user can view the group.

  Important Notes:
  - **Use Case**: This table manages user access to groups.
  - **Do Not Use for**: Handling group payments or trip details.

  Validation Process:
  Schema Adherence: Ensure the SQL solution references only the columns and tables defined in the provided schema.
  SQL Compatibility: Verify that the SQL syntax is compatible with PostgreSQL.
  Syntax Check: Ensure that each SQL statement in the solution has correct syntax and will not result in errors.
  Contextual Relevance: Ensure the SQL solution accurately reflects the user's request; return a relevant message and set executable to false if not possible.
  
  User Guidance: If the user asks for data but does not provide enough context (e.g., "In Busan Group, how much did Daraboth pay?"), ask them to provide more specifics. For instance, guide them to clarify whether they mean payments related to a trip, a group, or a specific period.

  Examples of Desired Output:

  User Input: "In Busan group, how many members are inside it?"
  AI JSON Response:
  {
      "sqlType": "SELECT",
      "sql": "SELECT g.grp_name, COUNT(DISTINCT m.id) AS member_count FROM grp_infm g JOIN member_infm m ON g.id = m.group_id WHERE g.grp_name = 'Busan' GROUP BY g.grp_name;",
      "executable": true,
      "responseMessage": "This query returns the number of members in the 'Busan' group."
  }
      
  User Input: "I want to know how much I spent on each trip and which group it belongs to."
  AI JSON Response:
  {
      "sqlType": "SELECT",
      "sql": "SELECT T.trp_name, T.spend, G.grp_name FROM trp_infm T JOIN grp_infm G ON T.group_id = G.id JOIN member_infm M ON T.mem_id LIKE '%' || M.id || '%' WHERE M.mem_name = '${userAskID}';",
      "executable": true,
      "responseMessage": "This query provides the amount you spent on each trip along with the associated group."
  }

  User Input: "Show me the total amount I have paid, grouped by group."
  AI JSON Response:
  {
      "sqlType": "SELECT",
      "sql": "SELECT G.grp_name, SUM(M.paid) AS total_paid FROM member_infm M JOIN grp_infm G ON M.group_id = G.id WHERE M.mem_name = '${userAskID}' GROUP BY G.grp_name;",
      "executable": true,
      "responseMessage": "This query shows the total amount you have paid, grouped by the group you belong to."
  }

  Guidelines:
  Generate complex SQL solutions that may involve multiple steps or operations.
  Ensure all SQL statements are compatible with PostgreSQL.
  Validate SQL syntax before including it in the JSON response.
  Use the provided schema to generate accurate and relevant SQL queries.
  Always format SQL queries as a single block of text.
  Ensure the SQL solution includes both the total amount spent and the currency. Handle currency codes as text and numeric values as appropriate.

  Text to Analyze:
  [${userAsk}]
  `;

  const result = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 250,
    },
    maxTokens: 150,
    temperature: 0.7,
  });

  const chat = await result.sendMessage(prompt);
  const response = await chat.response;

  const cleanedResponse = response.text().replace(/```json|```/g, "");

  try {
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

    return responseData;
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    return {
      AI_Answer: { responseMessage: "Error parsing AI response" },
      status: "Error parsing AI response",
      executeStatus: false,
      data: [],
      message: "Error parsing AI response",
    };
  }
};

/**
 * Get weather information
 * @returns {Promise<string>} - A promise that resolves with the weather information
 */
export const getWeather = async () => {
  try {
    // Fetch real-time weather data using an API (e.g., OpenWeatherMap)
    const weatherApiKey = process.env.WEATHER_API_KEY; // Store your API key in the environment variables
    if (!weatherApiKey) {
      throw new Error(
        "Weather API Key is undefined. Check your environment variables."
      );
    }

    const location = "Busan, South Korea"; // Default location
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=Busan&units=metric&appid=${weatherApiKey}`;

    // Make the API call
    const weatherResponse = await axios.get(weatherApiUrl);
    const weatherData = weatherResponse.data;

    // Determine the greeting based on the current time in Seoul (KST)
    const timezone = "Asia/Seoul";
    const currentTime = new Date().toLocaleString("en-US", {
      timeZone: timezone,
    });

    // Extract relevant data
    const temp = weatherData.main.temp; // Current temperature
    const tempMin = weatherData.main.temp_min; // Min temperature
    const tempMax = weatherData.main.temp_max; // Max temperature
    const feelsLike = weatherData.main.feels_like; // Max temperature
    const weatherCondition = weatherData.weather[0].description; // Weather description
    const date = new Date(currentTime); // Today's date

    const hour = new Date(currentTime).getHours();

    let greeting;
    if (hour >= 5 && hour < 12) {
      greeting = "Good morning! ☀️";
    } else if (hour >= 12 && hour < 17) {
      greeting = "Good afternoon! 🌤️";
    } else if (hour >= 17 && hour < 21) {
      greeting = "Good evening! 🌆";
    } else {
      greeting = "Good night! 🌙";
    }

    // Construct the prompt with real-time data
    const prompt = `
      Instruction:
      You are a virtual assistant tasked with generating a short and concise daily weather forecast notification.
      The notification should include:

      - Greeting: ${greeting}.
      - Date: ${date}.
      - Location: ${location}.
      - Weather Overview: ${weatherCondition}.
      - Temperature: High of ${tempMax}°C, low of ${tempMin}°C. Current temperature is ${temp}°C. Feels like ${feelsLike}°C.

      Context:
      The user's timezone is ${timezone}. Adjust your language to fit their local time.

      Notification Style:
      Keep the message as short as possible while remaining informative.
      Example: "${greeting} Today in ${location}: ${weatherCondition}, ${tempMax}°C/${tempMin}°C.Feels like ${feelsLike}°C. Have a great day!"
      Use emojis sparingly to keep it engaging and friendly.
    `;

    // Initialize the AI with your API key
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content using the AI
    const result = await model.generateContent(prompt);
    const aiMessage = result.response.text(); // AI-generated weather notification

    return aiMessage;
  } catch (error) {
    console.error("Error in getWeather function:", error);
    return `Error: Unable to fetch weather data or generate notification. Please try again later.`;
  }
};

/**
 * Get translation for a string
 * @param {string} str - The string to translate
 * @returns {Promise<string>} - A promise that resolves with the translated string
 */
export const getTranslate = async (str) => {
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
  const response = await result.response;
  console.log("response text : " + response.text());

  return response.text();
};

/**
 * Get Korean words for learning
 * @param {Object} messageObj - The message object
 * @param {Array} defaultChatHistory - The default chat history
 * @returns {Promise<string>} - A promise that resolves with the Korean words
 */
export const getKoreanWords = async (messageObj, defaultChatHistory = []) => {
  if (!messageObj) return "No message object provided";
  const Chat_ID = 1083931330;
  let chatHistory = [];

  // Get chat history from database
  try {
    const { getChat, templateSaveChat } = await import('./dbUtils.js');
    
    await new Promise((resolve) => {
      getChat({
        chat_id: Chat_ID,
        defaultChatHistory,
        onSuccess: ({ results }) => {
          if (results && results.length > 0) {
            chatHistory = results;
          } else {
            chatHistory = defaultChatHistory;
          }
          resolve();
        },
        onError: (response) => {
          console.log({ response });
          chatHistory = defaultChatHistory;
          resolve();
        },
      });
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
    Try creating your own sentence using one or both of today's words.
    `;

    const result = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 250,
      },
    });

    const chat = await result.sendMessage(prompt);
    const response = await chat.response;
    console.log("response text : " + response.text());

    // Save the chat
    await templateSaveChat({
      Chat_ID,
      chatHistory,
      messageText: "Let's start learning today!",
      responseText: response.text(),
    });

    return response.text();
  } catch (error) {
    console.error("Error getting Korean words:", error);
    return "Error getting Korean words. Please try again later.";
  }
};

/**
 * Get cleaning data and generate a response
 * @param {Object} data - The cleaning data
 * @param {string} msg - The message to respond to
 * @returns {Promise<string>} - A promise that resolves with the cleaning information
 */
export const getCleaningProm = async (data, msg) => {
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
  const response = result.response;
  console.log("response text : " + response.text());

  return response.text();
};
