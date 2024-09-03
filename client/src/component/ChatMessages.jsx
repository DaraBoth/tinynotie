import React from "react";
import {
  Box,
  Paper,
  Avatar,
  Typography,
  CircularProgress,
  useMediaQuery,  // Import useMediaQuery for responsiveness
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Import for extended Markdown (tables, etc.)

const ChatMessages = ({ messages, chatContainerRef, typing }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Check if screen is mobile

  const userMessageColor =
    theme.palette.mode === "dark" ? colors.primary[700] : colors.primary[300];
  const aiMessageColor =
    theme.palette.mode === "dark" ? colors.grey[800] : colors.grey[200];

  return (
    <Box
      ref={chatContainerRef}
      sx={{
        maxHeight: isMobile ? "80vh" : "60vh",  // Full height on mobile
        height: isMobile ? "80vh" : "60vh",     // Full height on mobile
        overflowY: "auto",
        padding: 2,
      }}
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
                sx={{
                  marginRight: 1,
                  backgroundColor: colors.primary[500],
                  color: "#fff",
                }}
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
                  msg.role === "user" ? userMessageColor : aiMessageColor,
                color: theme.palette.mode === "dark" ? "#fff" : "#000",
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
        <Typography
          variant="body2"
          component="div"
          sx={{
            color:
              theme.palette.mode === "dark"
                ? colors.grey[300]
                : colors.grey[700],
            textAlign: "center",
            marginTop: 2,
          }}
        >
          No chat yet. Start by typing a message!
        </Typography>
      )}

      {/* Typing Indicator */}
      {typing && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: 2,
            p: 2,
            backgroundColor: aiMessageColor,
            borderRadius: "18px",
            color: "#fff",
            maxWidth: "75%",
            boxShadow: `0px 4px 8px rgba(0, 0, 0, 0.1)`,
          }}
        >
          <CircularProgress size={20} sx={{ mr: 2 }} />
          <Typography
            variant="body2"
            sx={{
              color:
                theme.palette.mode === "dark"
                  ? colors.grey[300]
                  : colors.grey[700],
            }}
          >
            AI is typing...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChatMessages;
