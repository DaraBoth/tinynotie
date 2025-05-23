import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, useTheme, Box, IconButton, Typography, alpha, useMediaQuery } from '@mui/material';
import { tokens } from '../theme';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';
import useWindowDimensions from '../hooks/useWindowDimensions';

const CustomDialog = ({ open, onClose, title, children, sx }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { dialogDimensions } = useWindowDimensions();

  // Determine optimal dialog dimensions based on screen size
  const {
    width: optimalWidth,
    maxWidth: optimalMaxWidth,
    sideMargin,
    isSmallDevice,
    isVerySmallDevice
  } = dialogDimensions;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={motion.div}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300, // Standard MUI Dialog z-index
        '& .MuiDialog-container': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .MuiBackdrop-root': {
          zIndex: -1 // Relative to the dialog itself, not an absolute z-index
        },
        '& .MuiPopover-root': {
          zIndex: 1500 // Ensure popover menus appear above the dialog
        }
      }}
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.95 },
        transition: { duration: 0.3 },
        sx: {
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(20, 23, 39, 0.9)'
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          padding: {
            xs: isVerySmallDevice ? "12px" : isSmallDevice ? "14px" : "16px",
            md: "20px"
          },
          color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
          border: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 10px 25px rgba(0, 0, 0, 0.5)'
            : '0 10px 25px rgba(0, 0, 0, 0.1)',
          overflow: "hidden",
          margin: `${sideMargin}px`,
          position: 'relative',
          width: isMobile ? `${optimalWidth}px` : "auto",
          maxWidth: isMobile ? `${optimalMaxWidth}px` : "550px",
          minWidth: isMobile ? "auto" : "450px", // Override default minWidth for mobile
          ...sx,
        },
      }}
    >
      {/* Subtle gradient overlay for depth */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <DialogTitle
        sx={{
          color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
          fontSize: { xs: "1.1rem", md: "1.2rem" },
          fontWeight: 600,
          padding: { xs: "0 0 16px 0", md: "0 0 20px 0" },
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)'}`,
          marginBottom: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
            fontSize: { xs: "1.1rem", md: "1.2rem" },
            fontWeight: 600,
            letterSpacing: "-0.01em"
          }}
        >
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          component={motion.button}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          sx={{
            color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(colors.grey[800], 0.5)
              : alpha(colors.grey[200], 0.5),
            borderRadius: "8px",
            padding: "6px",
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(colors.grey[700], 0.7)
                : alpha(colors.grey[300], 0.7),
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
          padding: {
            xs: isVerySmallDevice ? "12px 0" : isSmallDevice ? "14px 0" : "16px 0",
            md: "20px 0"
          },
          position: "relative",
          zIndex: 1,
          fontSize: {
            xs: isVerySmallDevice ? "0.85rem" : "0.9rem",
            md: "1rem"
          },
          overflowY: "auto",
          maxHeight: isMobile ? `calc(100vh - ${sideMargin * 2 + 120}px)` : "calc(100vh - 200px)",
          '&::-webkit-scrollbar': {
            width: isMobile ? '6px' : '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark'
              ? alpha(colors.grey[700], 0.8)
              : alpha(colors.grey[400], 0.8),
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.mode === 'dark'
              ? alpha(colors.grey[600], 0.8)
              : alpha(colors.grey[500], 0.8),
          }
        }}
      >
        {children}
      </DialogContent>

      <DialogActions
        sx={{
          padding: {
            xs: isVerySmallDevice ? "12px 0 0 0" : isSmallDevice ? "14px 0 0 0" : "16px 0 0 0",
            md: "20px 0 0 0"
          },
          position: "relative",
          zIndex: 1,
          borderTop: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)'}`,
          marginTop: isVerySmallDevice ? 1 : isSmallDevice ? 1.5 : 2,
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          sx={{
            color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
            textTransform: "none",
            fontWeight: "500",
            fontSize: {
              xs: isVerySmallDevice ? "0.75rem" : "0.8rem",
              md: "0.9rem"
            },
            padding: {
              xs: isVerySmallDevice ? "4px 12px" : isSmallDevice ? "5px 14px" : "6px 16px",
              md: "8px 20px"
            },
            borderRadius: "8px",
            minWidth: isVerySmallDevice ? "60px" : isSmallDevice ? "70px" : "80px",
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;
