// ChatMessages.js
import React from "react";
import { Box, Paper, Avatar, Typography, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ChatMessages = ({ messages, chatContainerRef, typing }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

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
        <Typography variant="body2" component="div">
          No chat
        </Typography>
      )}
      {typing && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginTop: 1,
            padding: "12px 16px",
            backgroundColor: colors.grey[800],
            borderRadius: "18px",
            color: "#fff",
            maxWidth: "75%",
          }}
        >
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="body2">AI is typing...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChatMessages;
