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
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import useWindowDimensions from "../hooks/useWindowDimensions";
import CloseButton from "./CloseButton";

const FloatingChat = ({ userId, scrollDirection }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [suggestedMessage, setSuggestedMessage] = useState(""); // New state for suggested message
  const [typing, setTyping] = useState(false); // State for typing indicator
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const chatContainerRef = useRef(null); // Ref for the chat container
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Check if screen is mobile
  const { dialogDimensions } = useWindowDimensions(); // Get responsive dialog dimensions

  // Determine optimal dialog dimensions based on screen size
  const {
    width: optimalWidth,
    maxWidth: optimalMaxWidth,
    height: optimalHeight,
    sideMargin,
    isSmallDevice,
    isVerySmallDevice
  } = dialogDimensions;

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
        aria-label="chat"
        size="small"
        onClick={handleOpen}
        sx={{
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(66, 66, 255, 0.8)'
            : 'rgba(100, 100, 255, 0.8)',
          "&:hover": {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(66, 66, 255, 0.9)'
              : 'rgba(100, 100, 255, 0.9)',
            transform: "scale(1.1) translateZ(5px)",
            boxShadow: theme.palette.mode === 'dark'
              ? '0 5px 15px rgba(66, 66, 255, 0.5)'
              : '0 5px 15px rgba(100, 100, 255, 0.5)',
          },
          width: "48px",
          height: "48px",
          borderRadius: "50%", // Ensure perfect circle
          aspectRatio: "1/1", // Maintain aspect ratio
          transition: "transform 0.3s, box-shadow 0.3s, background-color 0.3s",
          boxShadow: theme.palette.mode === 'dark'
            ? '0 3px 10px rgba(0, 0, 0, 0.4)'
            : '0 3px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 1000, // Lower z-index to ensure it stays below dialogs
          color: '#fff',
          backdropFilter: 'blur(4px)',
          border: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(255, 255, 255, 0.5)'}`,
        }}
      >
        <ChatBubbleOutlineIcon fontSize={isMobile ? "medium" : "small"} />
      </Fab>

      {/* Close button outside the dialog */}
      {open && (
        <CloseButton
          onClick={handleClose}
          position="fixed"
          bottom={isMobile ? "24px" : "24px"}
          right={isMobile ? "24px" : "24px"}
          zIndex={1600}
          size="medium"
        />
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth={isMobile ? "xs" : "sm"}
        fullScreen={false}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
        sx={{
          zIndex: 1600, // Higher z-index to ensure it appears above floating buttons
          '& .MuiDialog-container': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            height: isMobile ? `${optimalHeight}px` : "80vh",
            maxHeight: isMobile ? `${optimalHeight}px` : "80vh",
            width: isMobile ? `${optimalWidth}px` : "auto",
            maxWidth: isMobile ? `${optimalMaxWidth}px` : "550px",
            minWidth: isMobile ? "auto" : "450px", // Override default minWidth for mobile
            margin: `${sideMargin}px auto`,
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)'}`,
            overflow: 'hidden',
            position: 'relative',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(40, 43, 59, 0.2) 0%, rgba(20, 23, 39, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(240, 240, 240, 0.2) 100%)',
              zIndex: -1,
            }
          },
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          sx={{
            borderBottom: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: isMobile ? 0 : '16px 16px 0 0',
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(66, 66, 255, 0.8)'
              : 'rgba(100, 100, 255, 0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 16px",
              minHeight: { xs: '56px', md: '64px' },
            }}
          >
            <Tooltip title="Clear Chat">
              <IconButton
                onClick={handleClearChat}
                sx={{
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#fff',
                fontSize: { xs: '1rem', md: '1.2rem' },
              }}
            >
              Chat with AI
            </Typography>
            {/* Spacer to maintain toolbar layout */}
            <Box sx={{ width: '40px' }} />
          </Toolbar>
        </AppBar>
        <DialogContent
          sx={{
            backgroundColor: 'transparent',
            color: theme.palette.mode === 'dark' ? '#fff' : '#333',
            padding: isMobile
              ? isVerySmallDevice ? "8px" : isSmallDevice ? "10px" : "12px"
              : "16px",
            height: 'calc(100% - 64px)',
            display: 'flex',
            flexDirection: 'column',
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
