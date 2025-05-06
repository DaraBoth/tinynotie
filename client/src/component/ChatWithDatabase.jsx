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
  Tooltip,
  Slide,
  useMediaQuery, // Import useMediaQuery for responsiveness
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveIcon from '@mui/icons-material/Remove';
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

const FloatingChat = ({ userId, scrollDirection }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [suggestedMessage, setSuggestedMessage] = useState(""); // New state for suggested message
  const [typing, setTyping] = useState(false); // State for typing indicator
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const chatContainerRef = useRef(null); // Ref for the chat container
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Check if screen is mobile

  useEffect(() => {
    const chatHistory =
      JSON.parse(localStorage.getItem(`chatHistory_${userId}`)) || [];
    setMessages(chatHistory);
    if (open) {
      handleScrollToBottom();
    }
  }, [userId, open]);

  useEffect(() => {
    localStorage.setItem(`chatHistory_${userId}`, JSON.stringify(messages));
    if (open) {
      handleScrollToBottom();
    }
  }, [messages, userId, open]);

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
        size="small"
        onClick={handleOpen}
        sx={{
          backgroundColor: colors.primary[500],
          "&:hover": {
            backgroundColor: colors.primary[700],
            transform: "scale(1.1) translateZ(5px)",
            boxShadow: `0 5px 15px ${colors.primary[500]}88`,
          },
          width: "40px",
          height: "40px",
          transition: "transform 0.3s, box-shadow 0.3s, background-color 0.3s",
          boxShadow: `0 3px 10px ${colors.primary[900]}66`,
        }}
      >
        <ChatBubbleOutlineIcon fontSize="small" />
      </Fab>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth={isMobile ? "xs" : "sm"} // Adjust maxWidth based on screen size
        fullScreen={isMobile} // Make dialog full screen on mobile
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }} // Adjust slide direction
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 1, // Remove border-radius on mobile for full-screen effect
            height: isMobile ? "100%" : "auto", // Full height on mobile
            backgroundColor: colors.grey[900], // Background color for the dialog
            color: colors.primary[100], // Text color for the dialog
          },
        }}
      >
        <AppBar
          position="static"
          sx={{
            borderBottom: `1px solid ${colors.grey[700]}`,
            borderRadius: 0,
            backgroundColor: colors.primary[500],
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 8px",
            }}
          >
            <Tooltip title="Clear Chat">
              <IconButton
                onClick={handleClearChat}
                disableRipple
                disableFocusRipple
                disableTouchRipple
                sx={{
                  color: colors.primary[900],
                  marginRight: 1,
                  "&:hover": {
                    backgroundColor: "transparent", // No hover background
                    color: colors.primary[900], // No hover color change
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Typography
              variant="h6"
              sx={{ fontWeight: 900, color: colors.primary[900] }}
            >
              Chat with AI
            </Typography>
            <Tooltip title="Minimize">
              <IconButton
                onClick={handleClose}
                disableRipple
                disableFocusRipple
                disableTouchRipple
                sx={{
                  color: colors.primary[900],
                  marginRight: 1,
                  "&:hover": {
                    backgroundColor: "transparent", // No hover background
                    color: colors.primary[900], // No hover color change
                  },
                }}
              >
                <RemoveIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <DialogContent
          sx={{
            backgroundColor: colors.grey[800],
            color: colors.grey[100],
            padding: isMobile ? "8px" : "16px",
          }}
        >
          <ChatMessages
            messages={messages}
            chatContainerRef={chatContainerRef}
            onSuggestionClick={handleSuggestionClick}
            typing={typing}
          />
          <ChatInput
            setMessages={setMessages}
            messages={messages} // Pass messages state here
            userId={userId}
            chatContainerRef={chatContainerRef}
            initialMessage={suggestedMessage}
            handleScrollToBottom={handleScrollToBottom}
            setTyping={setTyping}
          />
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

export default FloatingChat;
