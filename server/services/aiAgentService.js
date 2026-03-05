import { openai, OPENAI_CHAT_MODEL } from './openaiClient.js';
import { tools, handlers } from '../utils/aiTools.js';

/**
 * AI Agent Service
 * Handles multi-turn tool calling logic for both Web and Telegram
 */
export const runAiAgent = async ({ message, groupId, history = [], onToken, onStatus, onToolCall }) => {
    if (!openai?.chat?.completions) {
        throw new Error("OpenAI client is not configured. Missing OPENAI_API_KEY or OPEN_API_KEY.");
    }

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
Be precise with numbers. If you add a trip, confirm the members involved.
Return your responses in Markdown. Use Khmer if the user speaks Khmer, otherwise English.`
        },
        ...history,
        { role: "user", content: message }
    ];

    let runLoop = true;
    let loopCount = 0;
    let fullResponse = "";

    while (runLoop && loopCount < 5) {
        loopCount++;
        onStatus?.(`Thinking (Step ${loopCount})...`);

        const chatCompletion = await openai.chat.completions.create({
            model: OPENAI_CHAT_MODEL,
            messages,
            tools,
            tool_choice: "auto",
        });

        const responseMessage = chatCompletion.choices[0].message;
        messages.push(responseMessage);

        if (responseMessage.tool_calls) {
            onStatus?.(`Executing tools...`);
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);

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
            }
            // Continue loop to let AI process tool results
        } else {
            // No more tool calls, we are done
            fullResponse = responseMessage.content;
            onToken?.(fullResponse);
            runLoop = false;
        }
    }

    return fullResponse;
};

/**
 * Streaming version of the AI Agent
 * (Designed for SSE)
 */
export const streamAiAgent = async ({ message, groupId, history = [], sendEvent }) => {
    if (!openai?.chat?.completions) {
        throw new Error("OpenAI client is not configured. Missing OPENAI_API_KEY or OPEN_API_KEY.");
    }

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
Be precise with numbers. If you add a trip, confirm the members involved.
Return your responses in Markdown. Use Khmer if the user speaks Khmer, otherwise English.`
        },
        ...history,
        { role: "user", content: message }
    ];

    let runLoop = true;
    let loopCount = 0;

    while (runLoop && loopCount < 5) {
        loopCount++;

        const chatCompletion = await openai.chat.completions.create({
            model: OPENAI_CHAT_MODEL,
            messages,
            tools,
            tool_choice: "auto",
        });

        const responseMessage = chatCompletion.choices?.[0]?.message || { role: "assistant", content: "" };
        messages.push(responseMessage);

        if (responseMessage.tool_calls) {
            sendEvent("status", { message: "Executing tools..." });
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);

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
            }
        } else {
            if (responseMessage.content) {
                sendEvent("message", { delta: responseMessage.content });
            }
            runLoop = false;
        }
    }
};
