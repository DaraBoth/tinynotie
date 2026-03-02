import axios from "axios";
import moment from "moment";

/**
 * Receipt Service
 * Handles OCR and data extraction from receipt images using OpenAI Vision
 */
export const processReceiptImage = async (imageBase64, mimeType = 'image/jpeg') => {
    const apiKey = process.env.OPENAI_VISION_API_KEY || process.env.OPEN_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key is missing');
    }

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are an API endpoint that processes receipt images. Analyze this receipt image and extract all items, prices, and dates. Respond only in proper JSON format."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `
                  Analyze this receipt image and extract all items, prices, and dates.
                  You must respond only in proper JSON format using the structure below.
                  The key "data" should contain an array of objects where each object represents an **item** from the receipt, along with its price and additional metadata.

                  Use the following format:
                  {
                      "status": true,
                      "data": [
                          {
                              "trp_name": "[Item Name]",
                              "spend": [Price as a number],
                              "mem_id": "[]",
                              "create_date": "[Date from Receipt or current date in YYYY-MM-DD HH:mm:ss]"
                          },
                          ...
                      ]
                  }

                  **Important**: Return a clean JSON object. No markdown formatting. No backticks.
                  - "trp_name": Name of the item.
                  - "spend": Price as a number (0 if missing).
                  - "mem_id": Always "[]".
                  - "create_date": Receipt date or current date (${moment().format("YYYY-MM-DD HH:mm:ss")}).
                `,
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 1000,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );

        const result = JSON.parse(response.data.choices[0].message.content);
        return result;
    } catch (error) {
        console.error("Receipt processing error:", error.response?.data || error.message);
        throw error;
    }
};
