// ChatInput.js
import React, { useState, useEffect } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import { useAskDatabaseMutation } from "../api/api";
import ScrollToBottomButton from "./ScrollToBottomButton";

const ChatInput = ({
  setMessages,
  userId,
  chatContainerRef,
  initialMessage = "",
  handleScrollToBottom,
  setTyping, // Add typing state setter
}) => {
  const [inputMessage, setInputMessage] = useState(initialMessage);
  const [askDatabase, { isLoading }] = useAskDatabaseMutation();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  useEffect(() => {
    if (initialMessage) {
      setInputMessage(initialMessage);
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  const handleSendMessage = async (message = inputMessage) => {
    if (message.trim() === "") return;
    handleScrollToBottom();
    setTyping(true); // Set typing to true
    setMessages((prevMessages) =>
      Array.isArray(prevMessages)
        ? [...prevMessages, { role: "user", parts: [{ text: message }] }]
        : [{ role: "user", parts: [{ text: message }] }]
    );

    setInputMessage("");

    try {
      const response = await askDatabase({
        userAskID: userId.toLowerCase(),
        userAsk: message,
      }).unwrap();

      const aiMessage = {
        role: "model",
        parts: [
          { text: response.message || "AI could not process the request." },
        ],
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
    } finally {
      setTyping(false); // Set typing to false after response
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mt: 2,
        position: "relative",
      }}
    >
      <TextField
        variant="outlined"
        fullWidth
        placeholder="Type your message..."
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress} // Handle Enter key
        sx={{ mr: 1 }}
        InputProps={{
          sx: {
            backgroundColor: colors.grey[900],
            borderRadius: "24px",
            padding: "8px 16px",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          },
        }}
      />
      <ScrollToBottomButton
        handleScrollToBottom={handleScrollToBottom}
        chatContainerRef={chatContainerRef}
      />
      <IconButton
        onClick={() => handleSendMessage()}
        disabled={isLoading}
        color="primary"
        sx={{
          backgroundColor: colors.primary[500],
          "&:hover": {
            backgroundColor: colors.primary[700],
          },
        }}
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default ChatInput;
