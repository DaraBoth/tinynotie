import axios from "axios";
import moment from "moment";
import * as XLSX from "xlsx";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Real receipts are 200-500 chars; 3000 is a generous ceiling that avoids
// flooding the model with thousands of tokens from large spreadsheets/PDFs.
const MAX_TEXT_CHARS = 3000;

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
            // gpt-4o-mini supports vision equally well for receipt parsing at ~15x lower cost.
            model: "gpt-4o-mini",
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
 * Gemini fallback for receipt parsing.
 * Triggered automatically when the primary OpenAI call throws (rate limit, quota, network).
 * Uses gemini-1.5-flash which has excellent multilingual coverage:
 *   - English/Korean: near-parity with gpt-4o-mini
 *   - Khmer: stronger than OpenAI models due to Google's Southeast Asian training data
 * Returns the identical { status, data[] } shape as callReceiptModel.
 */
const callReceiptModelGemini = async ({ isImage, imageBase64, mimeType, extractedText }) => {
    const geminiApiKey = process.env.API_KEY2;
    if (!geminiApiKey) {
        throw new Error("Gemini API key (API_KEY2) is missing — cannot use fallback");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result;
    if (isImage) {
        // Vision path: pass base64 image inline
        result = await model.generateContent([
            { text: buildCommonInstruction() },
            { inlineData: { mimeType, data: imageBase64 } },
        ]);
    } else {
        // Text path: pass extracted text as a single prompt
        result = await model.generateContent(
            `${buildCommonInstruction()}\n\nExtracted Content:\n${extractedText || "(No readable text extracted)"}`
        );
    }

    return JSON.parse(cleanJsonText(result.response.text()));
};

/**
 * Receipt Service
 * Handles OCR and data extraction from receipt images/documents using OpenAI Vision
 * with automatic fallback to Gemini if OpenAI is unavailable.
 */
export const processReceiptImage = async (imageBase64, mimeType = 'image/jpeg', fileName = 'receipt') => {
    const apiKey = process.env.OPENAI_VISION_API_KEY || process.env.OPEN_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key is missing');
    }

    const isImage = String(mimeType || "").toLowerCase().startsWith("image/");

    if (isImage) {
        const messages = [
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
                            // 'low' caps cost to 85 tokens/image vs 765+ tokens/tile in 'high' mode.
                            detail: "low",
                        },
                    },
                ],
            },
        ];

        try {
            return await callReceiptModel({ apiKey, messages });
        } catch (openaiError) {
            console.warn("[receiptService] OpenAI vision failed, trying Gemini fallback:", openaiError.message);
            try {
                return await callReceiptModelGemini({ isImage: true, imageBase64, mimeType });
            } catch (geminiError) {
                console.error("[receiptService] Gemini fallback also failed:", geminiError.message);
                // Surface the primary error so callers see the root cause.
                throw openaiError;
            }
        }
    }

    // Non-image path: PDF, Excel, text, etc. — extract text first then send to model.
    const fileBuffer = Buffer.from(String(imageBase64 || ""), "base64");
    const extractedText = extractTextFromBuffer({ fileBuffer, mimeType, fileName });

    const messages = [
        {
            role: "system",
            content: "You are an API endpoint that processes receipt files and extracts itemized expense data.",
        },
        {
            role: "user",
            content: `${buildCommonInstruction()}\n\nFile: ${fileName}\nMime: ${mimeType}\n\nExtracted Content:\n${extractedText || "(No readable text extracted)"}`,
        },
    ];

    try {
        return await callReceiptModel({ apiKey, messages });
    } catch (openaiError) {
        console.warn("[receiptService] OpenAI text path failed, trying Gemini fallback:", openaiError.message);
        try {
            return await callReceiptModelGemini({ isImage: false, extractedText });
        } catch (geminiError) {
            console.error("[receiptService] Gemini fallback also failed:", geminiError.message);
            throw openaiError;
        }
    }
};
