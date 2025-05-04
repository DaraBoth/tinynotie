import axios from "axios";

/**
 * Creates a Telegram Bot API client instance
 * @param {string} baseURL - The base URL for the Telegram Bot API
 * @returns {Object} - An object with methods to interact with the Telegram Bot API
 */
export const createTelegramBotClient = (baseURL) => {
  return {
    /**
     * Send a GET request to the Telegram Bot API
     * @param {string} method - The API method to call
     * @param {Object} params - The parameters to send with the request
     * @returns {Promise} - The response from the API
     */
    get(method, params) {
      return axios.get(`/${method}`, {
        baseURL: baseURL,
        params,
      });
    },

    /**
     * Send a POST request to the Telegram Bot API
     * @param {string} method - The API method to call
     * @param {Object} data - The data to send with the request
     * @returns {Promise} - The response from the API
     */
    post(method, data) {
      return axios({
        method: "POST",
        baseURL: baseURL,
        url: `/${method}`,
        data,
      });
    },
  };
};

/**
 * Send a message to a Telegram chat
 * @param {Object} telegramClient - The Telegram Bot API client
 * @param {Object} messageObj - The message object containing chat information
 * @param {string} messageText - The text to send
 * @returns {Promise} - The response from the API
 */
export const sendTelegramMessage = (telegramClient, messageObj, messageText) => {
  return telegramClient.get("sendMessage", {
    chat_id: messageObj.chat.id || "",
    text: messageText,
  });
};

/**
 * Detect if a message is asking for permission
 * @param {string} message - The message to check
 * @returns {boolean} - True if the message is asking for permission
 */
export const detectAndExtractPermission = (message) => {
  const permissionRegex = /\b(permission to|ask permission for|I would like to ask permission for|asking permission to)\b.*?(leave|late|go outside)/i;
  return permissionRegex.test(message);
};

/**
 * Get the current date and time in Seoul timezone
 * @returns {Date} - The current date and time in Seoul timezone
 */
export const getDateInSeoulTime = () => {
  const timezone = "Asia/Seoul";
  const currentTime = new Date().toLocaleString("en-US", {
    timeZone: timezone,
  });
  return currentTime;
};

/**
 * Format a response for Telegram in Khmer language
 * @param {Object} apiResponse - The API response
 * @param {Object} telegramData - The Telegram data
 * @returns {string} - The formatted message
 */
export const formatTelegramResponseKhmer = (apiResponse, telegramData) => {
  const data = apiResponse.data.insertedRow;
  const username = telegramData.from.username;

  let message = `👋 សួស្ដី @${username} !\n\n`;

  // Handle messages based on transaction type
  if (data.withdrawal && data.withdrawal > 0) {
    // Withdrawal (Spend) Message
    message += `✅ ការចំណាយជោគជ័យ!\n`;
    message += `📅 កាលបរិច្ឆេទ: ${data.operatingDate}\n`;
    message += `💸 ចំនួនដែលបានដក: ${data.withdrawal}원\n`;
    if (data.operatingLocation) {
      message += `🏦 ទីតាំងប្រតិបត្តិការ: ${data.operatingLocation}\n`;
    } else {
      message += `🏦 ទីតាំងប្រតិបត្តិការ: មិនបានបញ្ជាក់\n`;
    }
    if (data.notes) {
      message += `🛒 ឥវ៉ាន់ដែលបានទិញ: ${data.notes}\n`;
    }
    if (data.other) {
      message += `🙋‍♂️ អ្នកទិញ: ${data.other}\n`;
    }
    message += `💵 សមតុល្យ: ${apiResponse.data.oldTotalAmount}원 -> ${apiResponse.data.newTotalAmount}원\n`;
    message += `📣 បងៗ, សូមជួយពិនិត្យ និងធ្វើការបង្វិលប្រាក់វិញ!\n`;
    message += `Please react ✅ after send or recieved.\n`;
  } else if (data.deposit && data.deposit > 0) {
    // Deposit (Top-Up) Message
    message += `✅ ការដាក់ប្រាក់ជោគជ័យ!\n`;
    message += `💰 ចំនួនដាក់បញ្ចូល: ${data.deposit}원\n`;
    message += `💵 សមតុល្យ: ${apiResponse.data.oldTotalAmount}원 -> ${apiResponse.data.newTotalAmount}원\n`;
    message += `📢 Please react ✅ after recieved.\n`;
  } else {
    // Default message for no transaction
    message += `⚠️ មិនមានការដកឬដាក់ប្រាក់ឡើយ!\n`;
  }
  return message;
};

/**
 * Get the guideline command text
 * @returns {string} - The guideline command text
 */
export const getGuideLineCommand = () => {
  const guideMessage = `
📋 *Command Guide:*

1️⃣ *donetopup*  
💳 Save 10000원 for this month.  
- Usage:  
\`/donetopup\`  

2️⃣ *buystuff*  
🛒 Record an expense with details.  
- Usage:  
\`/buystuff <description (Buyer, Stuff, Date, Location, Cost)>\`  
- Example:  
\`/buystuff បថបានទិញ​ អំបិល ១​កញ្ចប់​​ នៅ King Mart អស់ 3500원, 2024-05-01.\`  

3️⃣ *rollback*  
🔄 Undo the last entry (only if added *today*).  
- Usage:  
\`/rollback\`  

4️⃣ *whoclean*  
🧹 Get the cleaning schedule.  
- Usage:  
\`/whoclean\`  

5️⃣ *excel2002*  
📊 Get the link to the Excel file.  
- Usage:  
\`/excel2002\`  

6️⃣ *guideline*  
📖 Display this command guide.  
- Usage:  
\`/guideline\`  

⚠️ *Notes:*  
- For older mistakes, manual fixes are needed.  
- The bot will confirm success or failure after each command.  
`;
  return guideMessage;
};
