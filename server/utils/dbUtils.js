import pg from "pg";
const Pool = pg.Pool;

// Create a database connection pool
export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

/**
 * Execute a database query
 * @param {Object} options - The query options
 * @param {string} options.sql - The SQL query to execute
 * @param {Array} options.values - The values to use in the query
 * @returns {Promise} - A promise that resolves with the query results
 */
export const runQuery = async ({ sql, values }) => {
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

/**
 * Save chat history to the database
 * @param {Object} options - The save options
 * @param {string|number} options.chat_id - The chat ID
 * @param {Array} options.chat_history - The chat history to save
 * @param {string|null} options.user_id - The user ID (optional)
 * @returns {Promise} - A promise that resolves with the save result
 */
export const saveChat = async ({ chat_id, chat_history, user_id = null }) => {
  if (user_id != null && user_id.length >= 20) user_id = user_id.slice(0, 19);

  try {
    // First, check if the chat exists
    const sqlSelect = `SELECT chat_history FROM json_data WHERE chat_id = $1;`;
    const result = await pool.query(sqlSelect, [chat_id]);
    
    let updatedChatHistory;
    
    if (result.rows.length > 0) {
      // If chat exists, merge the existing history with the new history
      const existingHistory = result.rows[0].chat_history.chat || [];
      
      // Create a new array with both histories
      updatedChatHistory = { chat: [...existingHistory, ...chat_history] };
      
      // Update the existing chat
      const sqlUpdate = `
        UPDATE json_data 
        SET chat_history = $1, 
            user_id = COALESCE($2, user_id) 
        WHERE chat_id = $3;
      `;
      await pool.query(sqlUpdate, [updatedChatHistory, user_id, chat_id]);
    } else {
      // If chat doesn't exist, insert a new one
      updatedChatHistory = { chat: chat_history };
      const sqlInsert = `
        INSERT INTO json_data (chat_id, chat_history, user_id)
        VALUES ($1, $2, $3);
      `;
      await pool.query(sqlInsert, [chat_id, updatedChatHistory, user_id]);
    }
    
    return { isError: false, reason: "" };
  } catch (error) {
    console.error("Error saving chat:", error);
    return { isError: true, reason: error.message };
  }
};

/**
 * Get chat history from the database
 * @param {Object} options - The get options
 * @param {string|number} options.chat_id - The chat ID
 * @param {Function} options.onSuccess - The success callback
 * @param {Function} options.onError - The error callback
 */
export const getChat = async function ({
  chat_id,
  onSuccess = function () {},
  onError = function () {},
  defaultChatHistory = []
}) {
  const sql = `SELECT id, chat_id, chat_history FROM json_data WHERE chat_id = $1;`;
  const response = {
    isError: false,
    results: [],
    reason: "",
  };
  const values = [chat_id];
  try {
    const res = await runQuery({ sql, values });
    if (res && res.rowCount) {
      if (res.rowCount >= 1) {
        const his = res.rows[0].chat_history;
        response.results = his.chat || [];
      } else {
        response.results = defaultChatHistory;
        await saveChat({ chat_id, chat_history: defaultChatHistory });
      }
    } else {
      response.results = defaultChatHistory;
      await saveChat({ chat_id, chat_history: defaultChatHistory });
    }
    onSuccess(response);
  } catch (err) {
    response.isError = true;
    response.reason = err;
    onError(response);
  }
};

/**
 * Save chat history with template format
 * @param {Object} options - The save options
 * @param {string|number} options.Chat_ID - The chat ID
 * @param {string|null} options.user_id - The user ID (optional)
 * @param {Array} options.chatHistory - The chat history
 * @param {string} options.messageText - The message text
 * @param {string} options.responseText - The response text
 * @returns {Promise} - A promise that resolves with the save result
 */
export const templateSaveChat = async ({ 
  Chat_ID, 
  user_id = null, 
  chatHistory, 
  messageText, 
  responseText 
}) => {
  if (Array.isArray(chatHistory)) {
    // Create copies of the messages to avoid modifying the original objects
    const userMessage = { role: "user", parts: [{ text: messageText }] };
    const modelMessage = { role: "model", parts: [{ text: responseText }]};
    
    // Create a new array with the new messages
    const updatedChatHistory = [...chatHistory, userMessage, modelMessage];
    
    // Save the updated chat history
    return await saveChat({ 
      chat_id: Chat_ID, 
      chat_history: [userMessage, modelMessage], 
      user_id
    });
  }
  
  return { isError: true, reason: "Chat history is not an array" };
};
