import React, { useState, useEffect } from "react";
import { Fab, Zoom } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useTheme } from "@mui/material/styles"; // Import theme
import { tokens } from "../theme"; // Import tokens for theme colors

const ScrollToBottomButton = ({ chatContainerRef , handleScrollToBottom}) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme(); // Access the current theme
  const colors = tokens(theme.palette.mode); // Use tokens to get theme colors
  // Show button when user scrolls up
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          chatContainerRef.current;
        setVisible(scrollTop + clientHeight < scrollHeight - 100); // Show button if not scrolled to the bottom
      }
    };

    const containerRef = chatContainerRef.current;
    if (containerRef) {
      containerRef.addEventListener("scroll", handleScroll);
      return () => containerRef.removeEventListener("scroll", handleScroll);
    }
  }, [chatContainerRef]);

  return (
    <Zoom in={visible}>
      <Fab
        onClick={handleScrollToBottom}
        size="small"
        sx={{
          position: "absolute", // Change to absolute to keep it inside the container
          right: "50%", // Adjust to the inside of the container
          top: -25, // Adjust to the inside of the container
          backgroundColor: colors.grey[800], // Update to use colors matching your theme
          color: "#fff", // Icon color
          width: "32px",
          height: "32px",
          borderRadius: "50%", // Ensure perfect circle
          aspectRatio: "1/1", // Maintain aspect ratio
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.2)", // Subtle hover effect
          },
        }}
      >
        <KeyboardArrowDownIcon />
      </Fab>
    </Zoom>
  );
};

export default ScrollToBottomButton;
