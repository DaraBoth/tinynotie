import axios from "axios";
import moment from "moment";
import * as XLSX from "xlsx";

const MAX_TEXT_CHARS = 30000;

const cleanJsonText = (text = "") => {
    return String(text || "").replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
};

const normalizeText = (text = "") => {
    return String(text || "")
        .replace(/\u0000/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
};

const isExcelMime = (mimeType = "", fileName = "") => {
    const mime = String(mimeType || "").toLowerCase();
    const name = String(fileName || "").toLowerCase();
    return (
        mime.includes("spreadsheet") ||
        mime.includes("excel") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".xls")
    );
};

const isTextLikeMime = (mimeType = "", fileName = "") => {
    const mime = String(mimeType || "").toLowerCase();
    const name = String(fileName || "").toLowerCase();
    return (
        mime.startsWith("text/") ||
        mime.includes("json") ||
        mime.includes("csv") ||
        mime.includes("xml") ||
        name.endsWith(".txt") ||
        name.endsWith(".md") ||
        name.endsWith(".csv") ||
        name.endsWith(".json") ||
        name.endsWith(".xml")
    );
};

const extractTextFromExcel = (buffer) => {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames.slice(0, 3);

    const joined = sheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        return `Sheet: ${sheetName}\n${csv}`;
    }).join("\n\n");

    return normalizeText(joined).slice(0, MAX_TEXT_CHARS);
};

const extractTextFromBuffer = ({ fileBuffer, mimeType, fileName }) => {
    if (isExcelMime(mimeType, fileName)) {
        return extractTextFromExcel(fileBuffer);
    }

    if (isTextLikeMime(mimeType, fileName)) {
        return normalizeText(fileBuffer.toString("utf8")).slice(0, MAX_TEXT_CHARS);
    }

    // Fallback for pdf/doc/docx and other binary docs: best-effort text extraction.
    // Even if partial, it lets the model extract visible item/price patterns.
    return normalizeText(fileBuffer.toString("utf8")).slice(0, MAX_TEXT_CHARS);
};

const buildCommonInstruction = () => `
Analyze the provided receipt content and extract all purchasable items and prices.
Return ONLY a valid JSON object with this shape:
{
  "status": true,
  "data": [
    {
      "trp_name": "[Item Name]",
      "spend": [Price as number],
      "mem_id": "[]",
      "create_date": "[Date from receipt or current date in YYYY-MM-DD HH:mm:ss]"
    }
  ]
}

Rules:
- No markdown, no code fences.
- If item name missing, use empty string.
- If price missing, use 0.
- "mem_id" must always be "[]".
- create_date should be receipt date if visible, else ${moment().format("YYYY-MM-DD HH:mm:ss")}.
`;

const callReceiptModel = async ({ apiKey, messages }) => {
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-4o",
            messages,
            max_tokens: 1200,
            response_format: { type: "json_object" },
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
        }
    );

    const content = response?.data?.choices?.[0]?.message?.content || "{}";
    return JSON.parse(cleanJsonText(content));
};

/**
 * Receipt Service
 * Handles OCR and data extraction from receipt images using OpenAI Vision
 */
export const processReceiptImage = async (imageBase64, mimeType = 'image/jpeg', fileName = 'receipt') => {
    const apiKey = process.env.OPENAI_VISION_API_KEY || process.env.OPEN_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key is missing');
    }

    try {
        const isImage = String(mimeType || "").toLowerCase().startsWith("image/");

        if (isImage) {
            return await callReceiptModel({
                apiKey,
                messages: [
                    {
                        role: "system",
                        content: "You are an API endpoint that processes receipt files and extracts itemized expense data.",
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: buildCommonInstruction() },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`,
                                },
                            },
                        ],
                    },
                ],
            });
        }

        const fileBuffer = Buffer.from(String(imageBase64 || ""), "base64");
        const extractedText = extractTextFromBuffer({ fileBuffer, mimeType, fileName });

        return await callReceiptModel({
            apiKey,
            messages: [
                {
                    role: "system",
                    content: "You are an API endpoint that processes receipt files and extracts itemized expense data.",
                },
                {
                    role: "user",
                    content: `${buildCommonInstruction()}\n\nFile: ${fileName}\nMime: ${mimeType}\n\nExtracted Content:\n${extractedText || "(No readable text extracted)"}`,
                },
            ],
        });
    } catch (error) {
        console.error("Receipt processing error:", error.response?.data || error.message);
        throw error;
    }
};
