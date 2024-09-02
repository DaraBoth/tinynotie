import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Fab,
  Dialog,
  DialogContent,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import MinimizeIcon from "@mui/icons-material/Minimize";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import ChatInput from "./ChatInput"; // New Component for input
import ChatMessages from "./ChatMessages"; // New Component for messages

const FloatingChat = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [suggestedMessage, setSuggestedMessage] = useState(""); // New state for suggested message
  const [typing, setTyping] = useState(false); // State for typing indicator
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const chatContainerRef = useRef(null); // Ref for the chat container

  useEffect(() => {
    const chatHistory =
      JSON.parse(sessionStorage.getItem(`chatHistory_${userId}`)) || [];
    setMessages(chatHistory);
    handleScrollToBottom();
  }, [userId]);

  useEffect(() => {
    sessionStorage.setItem(`chatHistory_${userId}`, JSON.stringify(messages));
    handleScrollToBottom();
  }, [messages, userId]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleClearChat = () => setMessages([]); // Clear chat history

  const handleSuggestionClick = (suggestion) => {
    setSuggestedMessage(suggestion); // Set suggested message to send it automatically
  };

  const handleScrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth", // Smooth scroll animation
      });
    }
  };

  return (
    <React.Fragment>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleOpen}
        sx={{
          position: "fixed",
          bottom: "85px",
          right: "16px",
          backgroundColor: colors.primary[500],
          "&:hover": {
            backgroundColor: colors.primary[700],
          },
        }}
      >
        <ChatBubbleOutlineIcon />
      </Fab>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <AppBar position="static" sx={{ backgroundColor: colors.grey[900] }}>
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 8px",
            }}
          >
            <Typography variant="h6">Chat with AI</Typography>
            <Box>
              <IconButton onClick={handleClearChat} color="inherit">
                <DeleteIcon />
              </IconButton>
              <IconButton onClick={handleClose} color="inherit">
                <MinimizeIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <ChatMessages
            messages={messages}
            chatContainerRef={chatContainerRef}
            onSuggestionClick={handleSuggestionClick} // Pass the suggestion handler
            typing={typing} // Pass typing state
          />
          <ChatInput
            setMessages={setMessages}
            userId={userId}
            chatContainerRef={chatContainerRef}
            initialMessage={suggestedMessage} // Pass suggested message
            handleScrollToBottom={handleScrollToBottom}
            setTyping={setTyping} // Pass setTyping to handle typing animation
          />
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

export default FloatingChat;
