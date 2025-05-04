import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Link,
  useTheme,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
} from "@mui/material";
import TelegramIcon from "@mui/icons-material/Telegram";
import LockIcon from "@mui/icons-material/Lock";
import LoginIcon from "@mui/icons-material/Login";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { tokens } from "../theme";
import { useNavigate } from "react-router-dom";

const RegisterGuide = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  // State for copy feedback
  const [copiedCommand, setCopiedCommand] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Function to copy text to clipboard
  const copyToClipboard = (text, commandType) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedCommand(commandType);
        setSnackbarOpen(true);
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopiedCommand(null);
        }, 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const steps = [
    {
      label: "Open Telegram Bot",
      description: (
        <>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[200] : colors.grey[800], // Lighter color for better visibility
              fontSize: "0.95rem",
              fontWeight: 400, // Slightly bolder for better visibility
            }}
          >
            Click the button below to open our Telegram bot:
          </Typography>
          <Button
            variant="outlined" // Match the register button style from login page
            startIcon={<TelegramIcon sx={{ fontSize: { xs: "1.1rem", sm: "1.2rem" } }} />}
            href="https://t.me/DarabothBot"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              mt: 1,
              mb: 1.5,
              color: theme.palette.mode === "dark" ? colors.blueAccent[300] : colors.primary[500],
              borderColor: theme.palette.mode === "dark" ? colors.blueAccent[400] : colors.primary[300],
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "rgba(82, 118, 255, 0.08)",
                borderColor: theme.palette.mode === "dark" ? colors.blueAccent[300] : colors.primary[400],
                color: theme.palette.mode === "dark" ? colors.blueAccent[200] : colors.primary[600],
              },
              "&:active": {
                transform: "translateY(1px)",
              },
              fontWeight: "medium",
              borderRadius: "8px",
              textTransform: "none",
              fontSize: { xs: "0.85rem", sm: "0.9rem" },
              padding: { xs: "6px 12px", sm: "8px 16px" },
              height: { xs: "36px", sm: "40px" },
              transition: "all 0.2s ease",
              width: "100%", // Match the register button width
            }}
          >
            Open @DarabothBot
          </Button>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[600], // Lighter color for better visibility
              fontSize: "0.85rem",
              fontStyle: "italic",
              opacity: 0.9, // Slightly more opaque for better visibility
            }}
          >
            If the button doesn't work, search for @DarabothBot in Telegram.
          </Typography>
        </>
      ),
    },
    {
      label: "Register Your Account",
      description: (
        <>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[200] : colors.grey[800], // Lighter color for better visibility
              fontSize: "0.95rem",
              fontWeight: 400, // Slightly bolder for better visibility
            }}
          >
            Send the following command to the bot in a private chat:
          </Typography>
          <Paper
            sx={{
              p: { xs: 1.5, sm: 2 },
              my: { xs: 1.5, sm: 2 },
              backgroundColor: theme.palette.mode === "dark" ? "rgba(30, 31, 48, 0.7)" : colors.grey[100], // Darker background to match login inputs
              borderLeft: `4px solid ${theme.palette.mode === "dark" ? colors.blueAccent[400] : colors.blueAccent[500]}`,
              fontFamily: "monospace",
              color: theme.palette.mode === "dark" ? colors.grey[50] : colors.grey[900], // Brighter text for better visibility
              fontWeight: "bold",
              fontSize: { xs: "0.9rem", sm: "1rem" },
              boxShadow: theme.palette.mode === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "6px",
              border: `1px solid ${theme.palette.mode === "dark" ? colors.blueAccent[400] : colors.blueAccent[500]}`, // Add border for better visibility
            }}
          >
            <Box component="span">/register</Box>
            <Tooltip title={copiedCommand === "register" ? "Copied!" : "Copy to clipboard"}>
              <IconButton
                size="small"
                onClick={() => copyToClipboard("/register", "register")}
                sx={{
                  color: theme.palette.mode === "dark" ? colors.blueAccent[300] : colors.blueAccent[600],
                  padding: { xs: "4px", sm: "6px" },
                  '&:hover': {
                    backgroundColor: theme.palette.mode === "dark" ? 'rgba(82, 118, 255, 0.1)' : 'rgba(82, 118, 255, 0.08)',
                  }
                }}
              >
                {copiedCommand === "register" ?
                  <CheckCircleOutlineIcon sx={{ fontSize: { xs: "16px", sm: "18px" } }} /> :
                  <ContentCopyIcon sx={{ fontSize: { xs: "16px", sm: "18px" } }} />
                }
              </IconButton>
            </Tooltip>
          </Paper>
          <Typography
            variant="body2"
            gutterBottom
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[800],
              fontSize: "0.9rem",
            }}
          >
            The bot will create an account using your Telegram username.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.mode === "dark" ? colors.redAccent[200] : colors.redAccent[700], // Brighter red for better visibility
              fontSize: "0.85rem",
              fontWeight: "500",
              mt: 1,
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(211, 47, 47, 0.1)", // Add subtle background
              padding: "6px 10px",
              borderRadius: "4px",
              border: `1px solid ${theme.palette.mode === "dark" ? colors.redAccent[400] : colors.redAccent[200]}`,
            }}
          >
            <Box component="span" sx={{ fontWeight: "bold", mr: 0.5 }}>Note:</Box> Your initial password will be set to "123456"
          </Typography>
        </>
      ),
    },
    {
      label: "Set a Secure Password",
      description: (
        <>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[200] : colors.grey[800], // Lighter color for better visibility
              fontSize: "0.95rem",
              fontWeight: 400, // Slightly bolder for better visibility
            }}
          >
            After registering, set a secure password by sending:
          </Typography>
          <Paper
            sx={{
              p: { xs: 1.5, sm: 2 },
              my: { xs: 1.5, sm: 2 },
              backgroundColor: theme.palette.mode === "dark" ? "rgba(30, 31, 48, 0.7)" : colors.grey[100], // Darker background to match login inputs
              borderLeft: `4px solid ${theme.palette.mode === "dark" ? colors.blueAccent[400] : colors.blueAccent[500]}`,
              fontFamily: "monospace",
              color: theme.palette.mode === "dark" ? colors.grey[50] : colors.grey[900], // Brighter text for better visibility
              fontWeight: "bold",
              fontSize: { xs: "0.9rem", sm: "1rem" },
              boxShadow: theme.palette.mode === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderRadius: "6px",
              border: `1px solid ${theme.palette.mode === "dark" ? colors.blueAccent[400] : colors.blueAccent[500]}`, // Add border for better visibility
            }}
          >
            <Box component="span">/password YourNewPassword</Box>
            <Tooltip title={copiedCommand === "password" ? "Copied!" : "Copy to clipboard"}>
              <IconButton
                size="small"
                onClick={() => copyToClipboard("/password YourNewPassword", "password")}
                sx={{
                  color: theme.palette.mode === "dark" ? colors.blueAccent[300] : colors.blueAccent[600],
                  padding: { xs: "4px", sm: "6px" },
                  '&:hover': {
                    backgroundColor: theme.palette.mode === "dark" ? 'rgba(82, 118, 255, 0.1)' : 'rgba(82, 118, 255, 0.08)',
                  }
                }}
              >
                {copiedCommand === "password" ?
                  <CheckCircleOutlineIcon sx={{ fontSize: { xs: "16px", sm: "18px" } }} /> :
                  <ContentCopyIcon sx={{ fontSize: { xs: "16px", sm: "18px" } }} />
                }
              </IconButton>
            </Tooltip>
          </Paper>
          <Typography
            variant="body2"
            gutterBottom
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[800],
              fontSize: "0.9rem",
            }}
          >
            Replace "YourNewPassword" with a secure password (minimum 6 characters).
          </Typography>
          <Box
            sx={{
              p: 1.5,
              mt: 1,
              backgroundColor: theme.palette.mode === "dark" ? "rgba(211, 47, 47, 0.15)" : "rgba(211, 47, 47, 0.1)", // Slightly darker for better contrast
              borderRadius: "4px",
              borderLeft: `3px solid ${theme.palette.mode === "dark" ? colors.redAccent[400] : colors.redAccent[500]}`,
              border: `1px solid ${theme.palette.mode === "dark" ? colors.redAccent[400] : colors.redAccent[200]}`, // Add border for better visibility
              boxShadow: theme.palette.mode === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.mode === "dark" ? colors.redAccent[200] : colors.redAccent[700], // Brighter red for better visibility
                fontSize: "0.85rem",
                fontWeight: "500",
              }}
            >
              <Box component="span" sx={{ fontWeight: "bold", mr: 0.5 }}>Important:</Box>
              Choose a strong password that you don't use elsewhere.
            </Typography>
          </Box>
        </>
      ),
    },
    {
      label: "Login to the App",
      description: (
        <>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[200] : colors.grey[800], // Lighter color for better visibility
              fontSize: "0.95rem",
              fontWeight: 400, // Slightly bolder for better visibility
            }}
          >
            Now you can log in to the app using:
          </Typography>
          <Box
            sx={{
              ml: 2,
              p: 2,
              backgroundColor: theme.palette.mode === "dark" ? "rgba(30, 31, 48, 0.7)" : colors.grey[100], // Darker background to match login inputs
              borderRadius: "8px",
              border: `1px solid ${theme.palette.mode === "dark" ? colors.blueAccent[400] : colors.grey[300]}`, // Blue border for better visibility
              mt: 1,
              mb: 2,
              boxShadow: theme.palette.mode === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography
              variant="body1"
              gutterBottom
              sx={{
                color: theme.palette.mode === "dark" ? colors.grey[200] : colors.grey[800], // Lighter color for better visibility
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                fontWeight: 400, // Slightly bolder for better visibility
              }}
            >
              <Box component="span" sx={{
                fontWeight: "bold",
                mr: 1,
                color: theme.palette.mode === "dark" ? colors.greenAccent[400] : colors.greenAccent[600],
              }}>
                Username:
              </Box>
              Your Telegram username
            </Typography>
            <Typography
              variant="body1"
              gutterBottom
              sx={{
                color: theme.palette.mode === "dark" ? colors.grey[200] : colors.grey[800], // Lighter color for better visibility
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                fontWeight: 400, // Slightly bolder for better visibility
              }}
            >
              <Box component="span" sx={{
                fontWeight: "bold",
                mr: 1,
                color: theme.palette.mode === "dark" ? colors.greenAccent[400] : colors.greenAccent[600],
              }}>
                Password:
              </Box>
              The password you set in the previous step
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<LoginIcon sx={{ fontSize: { xs: "1.1rem", sm: "1.2rem" } }} />}
            onClick={() => navigate("/login")}
            sx={{
              mt: { xs: 1.5, sm: 2 },
              backgroundColor: colors.blueAccent[500], // Match login button color
              color: "#fff",
              "&:hover": {
                backgroundColor: colors.blueAccent[600], // Match login button hover color
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              },
              "&:active": {
                transform: "translateY(1px)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
              },
              fontWeight: "medium", // Match login button weight
              borderRadius: "8px", // Match login button radius
              textTransform: "none",
              fontSize: { xs: "0.85rem", sm: "0.9rem" },
              padding: { xs: "6px 12px", sm: "8px 16px" },
              height: { xs: "36px", sm: "40px" },
              transition: "all 0.2s ease",
              boxShadow: "none", // Match login button shadow
            }}
          >
            Go to Login Page
          </Button>
        </>
      ),
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: colors.primary[900], // Match the login page background
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: { xs: 2, sm: 3 },
        overflowY: "auto",
      }}
    >
    <Box
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", sm: 600, md: 700 },
        mx: "auto",
        p: { xs: 1.5, sm: 2, md: 3 },
        mb: { xs: 4, md: 6 },
        overflowX: "hidden",
      }}
    >
      <Button
        startIcon={<ArrowBackIcon sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }} />}
        onClick={() => navigate("/login")}
        sx={{
          mb: 1.5,
          color: theme.palette.mode === "dark" ? colors.blueAccent[300] : colors.blueAccent[600],
          fontSize: { xs: "0.85rem", sm: "0.9rem" },
          fontWeight: "500",
          padding: { xs: "4px 8px", sm: "6px 10px" },
          minWidth: "auto",
          borderRadius: "8px",
          "&:hover": {
            backgroundColor: theme.palette.mode === "dark" ? "rgba(82, 118, 255, 0.08)" : "rgba(82, 118, 255, 0.05)",
            color: theme.palette.mode === "dark" ? colors.blueAccent[200] : colors.blueAccent[400],
          }
        }}
      >
        Back to Login
      </Button>

      <Alert
        severity="info"
        sx={{
          mb: 2,
          py: { xs: 1, sm: 1.5 },
          px: { xs: 1.5, sm: 2 },
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[700] : colors.primary[100],
          color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[800],
          "& .MuiAlert-icon": {
            color: theme.palette.mode === "dark" ? colors.blueAccent[300] : colors.blueAccent[500],
            fontSize: { xs: "1.2rem", sm: "1.3rem" },
            marginRight: { xs: 1, sm: 1.5 },
          },
          "& .MuiAlert-message": {
            fontSize: { xs: "0.85rem", sm: "0.9rem" },
            padding: 0,
          },
          border: `1px solid ${theme.palette.mode === "dark" ? colors.primary[500] : colors.primary[200]}`,
          borderRadius: "10px",
        }}
      >
        Registration through our Telegram bot ensures secure account creation with your unique Telegram username.
      </Alert>

      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3, md: 3.5 },
          borderRadius: { xs: "14px", sm: "16px" },
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[800] : "#fff", // Match login form background
          border: `1px solid ${theme.palette.mode === "dark" ? colors.primary[700] : colors.grey[300]}`,
          boxShadow: theme.palette.mode === "dark"
            ? "0 4px 20px rgba(0, 0, 0, 0.4)"
            : "0 4px 20px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ mb: { xs: 2.5, sm: 3.5 }, textAlign: "center" }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              color: colors.blueAccent[300], // Match login page title color
              fontWeight: 500, // Match login page title weight
              fontSize: { xs: "1.4rem", sm: "1.6rem", md: "1.8rem" },
              fontFamily: 'Bricolage Grotesque, Montserrat, Poppins, sans-serif',
              letterSpacing: "0.5px",
              mb: { xs: 0.5, sm: 1 },
            }}
          >
            Register via <span style={{ color: "#fff" }}>Telegram</span>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700], // Lighter color for better visibility
              fontSize: { xs: "0.85rem", sm: "0.9rem", md: "0.95rem" },
              maxWidth: "500px",
              mx: "auto",
              lineHeight: 1.5,
              opacity: 0.9, // Slightly more opaque for better visibility
            }}
          >
            Follow these steps to create your account using our Telegram bot
          </Typography>
        </Box>

        <Divider sx={{ mb: { xs: 2.5, sm: 3 } }} />

        <Stepper
          orientation="vertical"
          sx={{
            '& .MuiStepConnector-line': {
              borderColor: theme.palette.mode === "dark" ? colors.primary[600] : colors.grey[300],
              borderLeftWidth: 2,
              minHeight: { xs: 16, sm: 20 },
            },
            '& .MuiStepLabel-iconContainer': {
              paddingRight: { xs: 1, sm: 1.5 },
            },
            '& .MuiStepContent-root': {
              marginLeft: { xs: 1.25, sm: 1.5 },
            },
          }}
        >
          {steps.map((step) => (
            <Step
              key={step.label}
              active={true}
              sx={{
                '&.MuiStep-root': {
                  mb: { xs: 2, sm: 2.5 },
                }
              }}
            >
              <StepLabel
                StepIconProps={{
                  sx: {
                    color: theme.palette.mode === "dark" ? colors.greenAccent[400] : colors.greenAccent[600],
                    '&.Mui-active': {
                      color: theme.palette.mode === "dark" ? colors.greenAccent[300] : colors.greenAccent[500],
                    },
                    fontSize: { xs: "1.2rem", sm: "1.3rem" },
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.mode === "dark" ? colors.blueAccent[200] : colors.primary[600], // Brighter color for better visibility
                    fontWeight: 600,
                    fontSize: { xs: "0.95rem", sm: "1rem", md: "1.05rem" },
                    lineHeight: 1.3,
                  }}
                >
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent
                sx={{
                  borderLeft: `2px solid ${theme.palette.mode === "dark" ? colors.primary[600] : colors.grey[300]}`,
                  ml: 0.5,
                  pl: { xs: 1.5, sm: 2 },
                  pb: { xs: 0.5, sm: 1 },
                }}
              >
                <Box sx={{ mb: { xs: 1, sm: 1.5 } }}>{step.description}</Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        <Box
          sx={{
            mt: { xs: 3, sm: 4 },
            pt: { xs: 1.5, sm: 2 },
            borderTop: `1px solid ${theme.palette.mode === "dark" ? colors.primary[700] : colors.grey[300]}`,
            backgroundColor: theme.palette.mode === "dark" ? colors.primary[800] : colors.grey[50],
            p: { xs: 1.5, sm: 2 },
            borderRadius: { xs: "0 0 14px 14px", sm: "0 0 16px 16px" },
            marginX: { xs: -2, sm: -3, md: -3.5 },
            marginBottom: { xs: -2, sm: -3, md: -3.5 },
            paddingX: { xs: 2, sm: 3 },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700], // Lighter color for better visibility
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              gap: { xs: 0.5, sm: 0 },
              fontWeight: 400, // Slightly bolder for better visibility
            }}
          >
            <span>Having trouble? Contact the developer directly on Telegram:</span>{" "}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                ml: { xs: 0, sm: 0.5 },
              }}
            >
              <Link
                href="https://t.me/l3oth"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: theme.palette.mode === "dark" ? colors.blueAccent[300] : colors.blueAccent[600],
                  textDecoration: "none",
                  fontWeight: "bold",
                  "&:hover": {
                    textDecoration: "underline",
                  }
                }}
              >
                @l3oth
              </Link>
              <Tooltip title={copiedCommand === "telegram" ? "Copied!" : "Copy username"}>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard("@l3oth", "telegram")}
                  sx={{
                    color: theme.palette.mode === "dark" ? colors.blueAccent[300] : colors.blueAccent[600],
                    padding: '2px',
                    ml: 0.5,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === "dark" ? 'rgba(82, 118, 255, 0.1)' : 'rgba(82, 118, 255, 0.08)',
                    }
                  }}
                >
                  {copiedCommand === "telegram" ?
                    <CheckCircleOutlineIcon fontSize="small" sx={{ fontSize: '14px' }} /> :
                    <ContentCopyIcon fontSize="small" sx={{ fontSize: '14px' }} />
                  }
                </IconButton>
              </Tooltip>
            </Box>
          </Typography>
          <Box
            sx={{
              mt: { xs: 1.5, sm: 2 },
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <LockIcon
              fontSize="small"
              sx={{
                mr: 1,
                color: theme.palette.mode === "dark" ? colors.greenAccent[400] : colors.greenAccent[600],
                fontSize: { xs: "0.9rem", sm: "1rem" },
                mt: "2px",
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700], // Lighter color for better visibility
                fontSize: { xs: "0.8rem", sm: "0.85rem" },
                lineHeight: 1.4,
                fontWeight: 400, // Slightly bolder for better visibility
              }}
            >
              Your Telegram username helps us create a unique account for you.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Snackbar for copy feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: theme.palette.mode === "dark" ? colors.primary[700] : colors.primary[100],
            color: theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[800],
            fontWeight: 500,
            fontSize: { xs: '0.8rem', sm: '0.85rem' },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            boxShadow: theme.palette.mode === "dark" ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${theme.palette.mode === "dark" ? colors.primary[600] : colors.primary[200]}`,
            borderRadius: '8px',
            padding: { xs: '6px 12px', sm: '8px 16px' },
            minWidth: 'auto',
            maxWidth: '90%',
          }
        }}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleOutlineIcon
              fontSize="small"
              sx={{
                color: theme.palette.mode === "dark" ? colors.greenAccent[400] : colors.greenAccent[600],
                fontSize: { xs: '16px', sm: '18px' },
              }}
            />
            Command copied to clipboard!
          </Box>
        }
      />
    </Box>
    </Box>
  );
};

export default RegisterGuide;
