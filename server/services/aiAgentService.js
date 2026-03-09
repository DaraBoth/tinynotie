import { openai, OPENAI_CHAT_MODEL } from './openaiClient.js';
import { tools, handlers } from '../utils/aiTools.js';

const MAX_TOOL_ITERATIONS = Number(process.env.AI_MAX_TOOL_ITERATIONS || 20);
const OPENAI_CALL_TIMEOUT_MS = Number(process.env.OPENAI_CALL_TIMEOUT_MS || 45000);

const withTimeout = async (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`OpenAI call timed out after ${ms}ms`)), ms);
        }),
    ]);
};

const summarizeToolResult = (result) => {
    if (result == null) return 'No result';
    if (typeof result === 'string') return result.slice(0, 200);
    if (result.error) return `Error: ${String(result.error).slice(0, 200)}`;
    if (result.summary) return String(result.summary).slice(0, 200);
    if (result.message) return String(result.message).slice(0, 200);
    return 'Completed';
};

const buildFallbackSummary = ({ toolLog, reason }) => {
    if (!Array.isArray(toolLog) || toolLog.length === 0) {
        return 'I could not complete a full response this time, but the request has stopped safely. Please try again with a simpler instruction.';
    }

    const lines = toolLog.slice(-10).map((entry, index) => {
        const prefix = entry.ok ? 'OK' : 'ERR';
        return `${index + 1}. [${prefix}] ${entry.name}: ${entry.summary}`;
    });

    return [
        `I finished running tools and here is the latest summary (${reason}):`,
        ...lines,
        'If you want, I can continue from this state with a follow-up prompt.',
    ].join('\n');
};

const parseToolArguments = (rawArgs) => {
    if (typeof rawArgs !== 'string') return rawArgs || {};
    return JSON.parse(rawArgs);
};

/**
 * AI Agent Service
 * Handles multi-turn tool calling logic for both Web and Telegram
 */
export const runAiAgent = async ({ message, groupId, history = [], imageAttachment = null, onToken, onStatus, onToolCall }) => {
    if (!openai?.chat?.completions) {
        throw new Error("OpenAI client is not configured. Missing OPENAI_API_KEY or OPEN_API_KEY.");
    }

    const userContent = imageAttachment?.base64
        ? [
            { type: "text", text: message || "Please analyze this uploaded image and help me." },
            { type: "image_url", image_url: { url: `data:${imageAttachment.mimeType || "image/png"};base64,${imageAttachment.base64}` } },
        ]
        : message;

    let messages = [
        {
            role: "system",
            content: `You are a helpful and professional financial assistant for the TinyNotie app.
Your goal is to help users manage their group expenses, members, and trips.
The current Group ID is ${groupId}. ALWAYS use this ID for tool calls.
You can:
1. Get group data (members and trips) to answer questions.
2. Add or update trips/expenses.
3. Add or update members.
        4. Use bulk update tools when the user asks to edit multiple members or multiple trips in one request.
Be precise with numbers. If you add a trip, confirm the members involved.
Return your responses in Markdown. Use Khmer if the user speaks Khmer, otherwise English.`
        },
        ...history,
        { role: "user", content: userContent }
    ];

    let runLoop = true;
    let loopCount = 0;
    let fullResponse = "";
    const toolLog = [];

    while (runLoop && loopCount < MAX_TOOL_ITERATIONS) {
        loopCount++;
        onStatus?.(`Thinking (Step ${loopCount})...`);

        const chatCompletion = await withTimeout(
            openai.chat.completions.create({
                model: OPENAI_CHAT_MODEL,
                messages,
                tools,
                tool_choice: "auto",
            }),
            OPENAI_CALL_TIMEOUT_MS,
        );

        const responseMessage = chatCompletion.choices[0].message;
        messages.push(responseMessage);

        if (responseMessage.tool_calls) {
            onStatus?.(`Executing tools...`);
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                let functionArgs;

                try {
                    functionArgs = parseToolArguments(toolCall.function.arguments);
                } catch {
                    functionArgs = {};
                }

                onToolCall?.({ name: functionName, args: functionArgs });

                const handler = handlers[functionName];
                let functionResponse;

                if (handler) {
                    try {
                        functionResponse = await handler(functionArgs);
                    } catch (error) {
                        functionResponse = { error: error.message };
                    }
                } else {
                    functionResponse = { error: `Tool ${functionName} not found` };
                }

                messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: functionName,
                    content: JSON.stringify(functionResponse),
                });

                toolLog.push({
                    name: functionName,
                    ok: !functionResponse?.error,
                    summary: summarizeToolResult(functionResponse),
                });
            }
            // Continue loop to let AI process tool results
        } else {
            // No more tool calls, we are done
            fullResponse = responseMessage.content || "";
            runLoop = false;
        }
    }

    if (!fullResponse) {
        const reason = loopCount >= MAX_TOOL_ITERATIONS
            ? `max steps reached (${MAX_TOOL_ITERATIONS})`
            : 'no final text generated';
        fullResponse = buildFallbackSummary({ toolLog, reason });
    }

    onToken?.(fullResponse);

    return fullResponse;
};

/**
 * Streaming version of the AI Agent
 * (Designed for SSE)
 */
export const streamAiAgent = async ({ message, groupId, history = [], imageAttachment = null, sendEvent }) => {
    if (!openai?.chat?.completions) {
        throw new Error("OpenAI client is not configured. Missing OPENAI_API_KEY or OPEN_API_KEY.");
    }

    const userContent = imageAttachment?.base64
        ? [
            { type: "text", text: message || "Please analyze this uploaded image and help me." },
            { type: "image_url", image_url: { url: `data:${imageAttachment.mimeType || "image/png"};base64,${imageAttachment.base64}` } },
        ]
        : message;

    let messages = [
        {
            role: "system",
            content: `You are a helpful and professional financial assistant for the TinyNotie app.
Your goal is to help users manage their group expenses, members, and trips.
The current Group ID is ${groupId}. ALWAYS use this ID for tool calls.
You can:
1. Get group data (members and trips) to answer questions.
2. Add or update trips/expenses.
3. Add or update members.
        4. Use bulk update tools when the user asks to edit multiple members or multiple trips in one request.
Be precise with numbers. If you add a trip, confirm the members involved.
Return your responses in Markdown. Use Khmer if the user speaks Khmer, otherwise English.`
        },
        ...history,
        { role: "user", content: userContent }
    ];

    let runLoop = true;
    let loopCount = 0;
    let finalResponseText = "";
    const toolLog = [];

    while (runLoop && loopCount < MAX_TOOL_ITERATIONS) {
        loopCount++;

        const chatCompletion = await withTimeout(
            openai.chat.completions.create({
                model: OPENAI_CHAT_MODEL,
                messages,
                tools,
                tool_choice: "auto",
            }),
            OPENAI_CALL_TIMEOUT_MS,
        );

        const responseMessage = chatCompletion.choices?.[0]?.message || { role: "assistant", content: "" };
        messages.push(responseMessage);

        if (responseMessage.tool_calls) {
            sendEvent("status", { message: "Executing tools..." });
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                let functionArgs;

                try {
                    functionArgs = parseToolArguments(toolCall.function.arguments);
                } catch {
                    functionArgs = {};
                }

                const handler = handlers[functionName];
                let functionResponse;

                if (handler) {
                    try {
                        functionResponse = await handler(functionArgs);
                    } catch (error) {
                        functionResponse = { error: error.message };
                    }
                } else {
                    functionResponse = { error: `Tool ${functionName} not found` };
                }

                sendEvent("tool_result", { tool: functionName, result: functionResponse });

                messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: functionName,
                    content: JSON.stringify(functionResponse),
                });

                toolLog.push({
                    name: functionName,
                    ok: !functionResponse?.error,
                    summary: summarizeToolResult(functionResponse),
                });
            }
        } else {
            if (responseMessage.content) {
                finalResponseText = responseMessage.content;
                sendEvent("message", { delta: responseMessage.content });
            }
            runLoop = false;
        }
    }

    if (!finalResponseText) {
        const reason = loopCount >= MAX_TOOL_ITERATIONS
            ? `max steps reached (${MAX_TOOL_ITERATIONS})`
            : 'no final text generated';
        finalResponseText = buildFallbackSummary({ toolLog, reason });
        sendEvent("message", { delta: finalResponseText });
    }

    return finalResponseText;
};
