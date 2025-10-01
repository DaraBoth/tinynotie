import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import moment from "moment";
import { getDateInSeoulTime } from "./telegramUtils.js";

// Excel API endpoints
const insertExcelEndpoint = "https://script.google.com/macros/s/AKfycbyBE2iov4vm_iT4Pm9cC0p3VUj1QeT5GhWeJnISJMfVQlhkTPB-acz1uT25HcTEpGzUrw/exec";
const rollBackExcelEndpoint = "https://script.google.com/macros/s/AKfycbzV8t07t8WJ_kYkWy1m-5V83SWv68PGeCPO5P7B_PctMG4BxmXODKRkqrKaSY9sQSB_og/exec";
export const excel2002Url = "https://docs.google.com/spreadsheets/d/1gnAloerX4kpirWFjnZiMXESWXPUgVYR1TboFv1MO70U/edit?pli=1&gid=1527944601#gid=1527944601";

/**
 * Handle inserting data into Excel
 * @param {Object} options - The options
 * @param {Object} options.messageObj - The message object
 * @param {string} options.messageText - The message text
 * @returns {Promise<string>} - A promise that resolves with the AI message
 */
export const handleInsertIntoExcel = async ({ messageObj, messageText }) => {
  // Initialize the AI with your API key
  const genAI = new GoogleGenerativeAI(process.env.API_KEY3);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const today = moment(getDateInSeoulTime()).format("YYYY-MM-DD");

  const prompt = `
  Generate a structured JSON response based on the following human text input. 
  Extract key details like date, withdrawal amount, location, item purchased, and the buyer. 
  If the date is not mentioned, use the current date. 
  Ensure the 'withdrawal', 'notes' (item bought), and 'other' (buyer) fields are mandatory. 
  The location is optional but default it to 'Main Branch' if not specified.
  
  Sample Text:
  "On January 5th, John bought shoes for 100 dollars from Branch A."
  Sample Text:
  "On January 5th, John bought shoes for 100 dollars from Branch A."

  Expected JSON Output:
  {
   "operatingDate": "${today}",
   "withdrawal": 100,
   "deposit": 0,
   "operatingLocation": "Branch A",
   "notes": "Buy Shoes",
   "other": "John"
 }

 Sample Text Without Date and Location:
 "Sarah bought a laptop for 800 dollars."

 Expected JSON Output:
 {
   "operatingDate": "${today}",
   "withdrawal": 800,
   "deposit": 0,
   "operatingLocation": "",
   "notes": "Buy Laptop",
   "other": "Sarah"
 }

 Notes on Behavior:
 - Current date = ${today}
 - If the date is missing ➝ Use the current date ${today}
 - If the location is missing ➝ Use the ""
 - Ensure every output includes "withdrawal", "notes", and "other".
 - "deposit" defaults to 0 unless explicitly stated.


 Here is the text to analyze:
 ${messageText}
  `;

  // Generate content using the AI
  const result = await model.generateContent(prompt);
  const aiMessage = result.response.text();
  console.log({ aiMessage });
  return aiMessage;
};

/**
 * Call the insert into Excel API
 * @param {Object} objectParams - The parameters to send
 * @returns {Promise<Object>} - A promise that resolves with the response
 */
export const callInsertIntoExcel = async (objectParams) => {
  const request = await axios.post(insertExcelEndpoint, objectParams);
  return request.data;
};

/**
 * Call the rollback Excel API
 * @returns {Promise<Object>} - A promise that resolves with the response
 */
export const callRollBackExcel = async () => {
  try {
    const response = await axios.get(rollBackExcelEndpoint);
    console.log(response.data); // The rollback response
    return response.data;
  } catch (error) {
    console.error("Rollback failed:", error);
    return { status: false, message: "Rollback failed" };
  }
};

/**
 * Get cleaning data from the API
 * @returns {Promise<Object>} - A promise that resolves with the cleaning data
 */
export const getCleaningData = async () => {
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
};
