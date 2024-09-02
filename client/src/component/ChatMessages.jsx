// ChatMessages.js
import React from "react";
import { Box, Paper, Avatar, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Import for extended Markdown (tables, etc.)

const ChatMessages = ({ messages, chatContainerRef , setMessages}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Suggested messages before the user starts chatting
  const suggestedMessages = [
    "What can I do with my groups?",
    "Show me a summary of my expenses.",
    "Can you provide an overview of my recent activities?",
    "Help me understand my trips.",
    "How do I add a new group?",
  ];

  return (
    <Box
      ref={chatContainerRef}
      sx={{ maxHeight: "60vh", height: "60vh", overflowY: "auto", padding: 2 }}
    >
      {Array.isArray(messages) && messages.length > 0 ? (
        messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              alignItems: "center",
              mb: 1,
            }}
          >
            {msg.role === "model" && (
              <Avatar
                sx={{ marginRight: 1, backgroundColor: colors.primary[500] }}
              >
                🤖
              </Avatar>
            )}
            <Paper
              elevation={3}
              sx={{
                padding: "12px 16px",
                borderRadius: "18px",
                backgroundColor:
                  msg.role === "user" ? colors.primary[700] : colors.grey[800],
                color: "#fff",
                maxWidth: "75%",
                wordBreak: "break-word",
                boxShadow: `0px 4px 8px rgba(0, 0, 0, 0.1)`,
              }}
            >
              <Typography variant="body2" component="div">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.parts[0].text}
                </ReactMarkdown>
              </Typography>
            </Paper>
          </Box>
        ))
      ) : (
        <Box>
          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
            Here are some things you can ask:
          </Typography>
          {suggestedMessages.map((suggestion, index) => (
            <Paper
              key={index}
              elevation={2}
              sx={{
                padding: "8px 12px",
                borderRadius: "12px",
                backgroundColor: colors.grey[800],
                color: "#fff",
                marginBottom: "8px",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: colors.primary[500],
                },
              }}
              onClick={() => {
                // Optional: Trigger the suggestion as a message input if needed
              }}
            >
              <Typography variant="body2">{suggestion}</Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ChatMessages;
