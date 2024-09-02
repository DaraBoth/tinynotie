import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Fab,
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Typography,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

const FloatingChat = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const chatHistory =
      JSON.parse(sessionStorage.getItem(`chatHistory_${userId}`)) || [];
    setMessages(chatHistory);
  }, [userId]);

  useEffect(() => {
    sessionStorage.setItem(`chatHistory_${userId}`, JSON.stringify(messages));
    handleScrollToBottom();
  }, [messages, userId]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

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
        <DialogContent>
          {/* Add Chat Title */}
          <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
            Chat with AI
          </Typography>
          <ChatMessages
            messages={messages}
            chatContainerRef={chatContainerRef}
            setMessages={setMessages}
            typing={typing}
          />
          <ChatInput
            setMessages={setMessages}
            messages={messages} // Pass messages to ChatInput
            userId={userId}
            chatContainerRef={chatContainerRef}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default FloatingChat;
