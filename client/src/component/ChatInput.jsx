import React, { useState, useEffect } from "react";
import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import { useAskDatabaseMutation } from "../api/api";
import ScrollToBottomButton from "./ScrollToBottomButton";

const ChatInput = ({
  setMessages,
  messages, // Accept messages as a prop
  userId,
  chatContainerRef,
  initialMessage = "",
  handleScrollToBottom,
  setTyping,
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

    const updatedMessages = [
      ...messages, // Use messages prop here
      { role: "user", parts: [{ text: message }] },
    ];

    setInputMessage("");

    try {
      const response = await askDatabase({
        userAskID: userId.toLowerCase(),
        userAsk: message,
        chatHistory: updatedMessages, // Send the chat history
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
      // Handle API error and provide feedback
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "model",
          parts: [
            {
              text: "There was an error processing your request. Please try again.",
            },
          ],
        },
      ]);
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
        borderRadius: "24px",
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        backgroundColor: colors.grey[900], // Background color for the input area
        padding: "4px 8px", // Inner padding for better spacing
      }}
    >
      <TextField
        variant="outlined"
        fullWidth
        placeholder="Type your message..."
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress} // Handle Enter key
        sx={{
          flex: 1, // Make it grow to fill space
          "& .MuiOutlinedInput-root": {
            borderRadius: "24px",
            backgroundColor: "transparent", // Transparent to match the parent box
            padding: "0 12px", // Less padding for a modern look
          },
          "& fieldset": {
            border: "none", // Remove the border for a clean look
          },
          "& input:-webkit-autofill": {
            WebkitBoxShadow: `0 0 0 1000px ${colors.grey[900]} inset !important`,
            WebkitTextFillColor: `${colors.primary[100]} !important`,
          },
        }}
        InputProps={{
          sx: {
            backgroundColor: colors.grey[900],
            color: colors.grey[100], // Ensure text color is visible in dark mode
            borderRadius: "24px",
            padding: "8px 16px",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            "::placeholder": { color: colors.grey[500] }, // Placeholder color
          },
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => handleSendMessage()}
                disabled={isLoading || inputMessage.trim() === ""}
                color="primary"
                sx={{
                  "&:hover": {
                    backgroundColor: colors.primary[700],
                  },
                  padding: 1,
                  margin: "0 8px",
                  borderRadius: "50%", // Circular send button
                }}
              >
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <ScrollToBottomButton
        handleScrollToBottom={handleScrollToBottom}
        chatContainerRef={chatContainerRef}
      />
    </Box>
  );
};

export default ChatInput;