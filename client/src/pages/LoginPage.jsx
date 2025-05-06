import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { usePostLoginMutation, usePostRegisterMutation } from "../api/api";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Person4RoundedIcon from "@mui/icons-material/Person4Rounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TelegramIcon from "@mui/icons-material/Telegram";
import { tokens } from "../theme";
import { Alert } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import MeowFootprint from "../component/MeowFootprint";
import SpaceSky from "../component/SpaceSky";
import Lottie from "lottie-react";
import goingggg from "../assets/goingggg.json";
import openeye from "../assets/openeye.json";

export default function Login({ setUser, setSecret }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirectUrl = new URLSearchParams(search).get("redirect") || "/";

  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [triggerLogin, resultLogin] = usePostLoginMutation();
  const [triggerRegister, resultRegister] = usePostRegisterMutation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleFormSubmit = debounce(async (values, { resetForm }) => {
    setLoading(true);
    const { username, password } = values;

    try {
      let response;
      if (isRegister) {
        response = await triggerRegister({
          usernm: username,
          passwd: password,
        }).unwrap();
        if (response.status) {
          setSnackbarMessage("Registration successful! Please login.");
          setSnackbarSuccess(true);
          setIsRegister(false);
        } else {
          setSnackbarMessage(
            response.message || "Registration failed. Please try again."
          );
          setSnackbarSuccess(false);
        }
      } else {
        response = await triggerLogin({
          usernm: username,
          passwd: password,
        }).unwrap();
        if (response.status) {
          setUser(response.usernm);
          setSecret(response._id);
          navigate(redirectUrl);
        } else {
          setSnackbarMessage(
            response.message || "Login failed. Please check your credentials."
          );
          setSnackbarSuccess(false);
        }
      }
      resetForm();
    } catch (error) {
      setSnackbarMessage(
        error.data?.message || "An error occurred. Please try again."
      );
      setSnackbarSuccess(false);
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  }, 500);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // Center vertically on all screen sizes
        padding: { xs: 2, sm: 3 },
        background: "transparent",
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* Add the 3D Space Sky background */}
      <SpaceSky />
      {/* <MeowFootprint /> */}
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
        validateOnChange
        validateOnBlur
      >
        {({ values, errors, touched, handleChange, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                width: "100%",
                maxWidth: "400px",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                padding: { xs: 2.5, sm: 3.5 },
                borderRadius: "16px",
                backgroundColor: colors.primary[800], // Adjusted to match the image
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                transition: "all 0.3s ease",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Typography
                variant="h5"
                color={colors.blueAccent[300]}
                textAlign="center"
                fontWeight="medium"
                sx={{
                  fontSize: { xs: "1.4rem", sm: "1.6rem" },
                  mb: 2,
                  letterSpacing: "0.5px",
                }}
              >
                {isRegister ? "Register" : "Login"} to{" "}
                <span style={{ color: "#fff" }}>TinyNotie</span>
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                type="text"
                label="Username"
                onChange={handleChange}
                value={values.username}
                name="username"
                error={Boolean(touched.username && errors.username)}
                helperText={touched.username && errors.username}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    position: 'absolute',
                    top: '-6px',
                    left: '-5px',
                    backgroundColor: 'transparent',
                    fontSize: '0.8rem',
                    paddingLeft: 0,
                    paddingRight: 0,
                    color: colors.blueAccent[300],
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      width: '100%',
                      borderBottom: `1px solid ${colors.blueAccent[400]}`,
                      zIndex: -1,
                    },
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person4RoundedIcon
                        style={{ color: colors.blueAccent[300] }}
                      />
                    </InputAdornment>
                  ),
                  style: {
                    color: colors.grey[100], // Ensure the text color adapts to the theme
                    paddingLeft: '8px', // Add some padding to match the image
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: { xs: "48px", sm: "52px" },
                    fontSize: { xs: "0.9rem", sm: "0.95rem" },
                    borderRadius: "8px",
                    backgroundColor: "rgba(30, 31, 48, 0.7)",
                    "& fieldset": {
                      borderColor: colors.blueAccent[400],
                      borderWidth: "1px",
                      borderTopWidth: "0px", // Remove top border to match the image
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                    },
                    "&:hover fieldset": {
                      borderColor: colors.blueAccent[300],
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.blueAccent[200],
                      borderWidth: "1px",
                      borderTopWidth: "0px", // Keep top border removed when focused
                    },
                    "& input": {
                      color: colors.grey[100],
                      paddingTop: "12px", // Adjust padding to match the image
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: colors.blueAccent[300],
                    fontSize: { xs: "0.8rem", sm: "0.85rem" },
                    transform: "translate(14px, -6px) scale(1)",
                    "&.Mui-focused, &.MuiFormLabel-filled": {
                      transform: "translate(14px, -6px) scale(1)",
                      color: colors.blueAccent[300],
                    },
                  },
                  "& .MuiInputAdornment-root": {
                    marginRight: "4px",
                    marginLeft: "-4px", // Adjust the left margin to match the image
                    "& .MuiSvgIcon-root": {
                      color: colors.blueAccent[300],
                      fontSize: "1.2rem", // Adjust icon size to match the image
                    },
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 1000px rgba(30, 31, 48, 0.7) inset !important`,
                    WebkitTextFillColor: `${colors.grey[100]} !important`,
                    transition: "background-color 5000s ease-in-out 0s !important",
                  },
                  "& input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
                    WebkitBoxShadow: `0 0 0 1000px rgba(30, 31, 48, 0.7) inset !important`,
                    WebkitTextFillColor: `${colors.grey[100]} !important`,
                  },
                  marginBottom: 1,
                }}
              />

              <TextField
                fullWidth
                variant="outlined"
                type={showPassword ? "text" : "password"}
                label="Password"
                onChange={handleChange}
                value={values.password}
                name="password"
                error={Boolean(touched.password && errors.password)}
                helperText={touched.password && errors.password}
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    position: 'absolute',
                    top: '-6px',
                    left: '-5px',
                    backgroundColor: 'transparent',
                    fontSize: '0.8rem',
                    paddingLeft: 0,
                    paddingRight: 0,
                    color: colors.blueAccent[300],
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      width: '100%',
                      borderBottom: `1px solid ${colors.blueAccent[400]}`,
                      zIndex: -1,
                    },
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon
                        style={{ color: colors.blueAccent[300] }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                           <Lottie
                           animationData={openeye}
                           loop={true}
                           style={{
                             width: 24,
                             height: 24,
                             mixBlendMode:"light"

                           }}
                         />
                        ) : (
                          <VisibilityOff
                            style={{ color: colors.blueAccent[300] }}
                          />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  style: {
                    color: colors.grey[100], // Ensure the text color adapts to the theme
                    paddingLeft: '8px', // Add some padding to match the image
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: { xs: "48px", sm: "52px" },
                    fontSize: { xs: "0.9rem", sm: "0.95rem" },
                    borderRadius: "8px",
                    backgroundColor: "rgba(30, 31, 48, 0.7)",
                    "& fieldset": {
                      borderColor: colors.blueAccent[400],
                      borderWidth: "1px",
                      borderTopWidth: "0px", // Remove top border to match the image
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                    },
                    "&:hover fieldset": {
                      borderColor: colors.blueAccent[300],
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.blueAccent[200],
                      borderWidth: "1px",
                      borderTopWidth: "0px", // Keep top border removed when focused
                    },
                    "& input": {
                      color: colors.grey[100],
                      paddingTop: "12px", // Adjust padding to match the image
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: colors.blueAccent[300],
                    fontSize: { xs: "0.8rem", sm: "0.85rem" },
                    transform: "translate(14px, -6px) scale(1)",
                    "&.Mui-focused, &.MuiFormLabel-filled": {
                      transform: "translate(14px, -6px) scale(1)",
                      color: colors.blueAccent[300],
                    },
                  },
                  "& .MuiInputAdornment-root": {
                    marginRight: "4px",
                    marginLeft: "-4px", // Adjust the left margin to match the image
                    "& .MuiSvgIcon-root": {
                      color: colors.blueAccent[300],
                      fontSize: "1.2rem", // Adjust icon size to match the image
                    },
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 1000px rgba(30, 31, 48, 0.7) inset !important`,
                    WebkitTextFillColor: `${colors.grey[100]} !important`,
                    transition: "background-color 5000s ease-in-out 0s !important",
                  },
                  "& input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
                    WebkitBoxShadow: `0 0 0 1000px rgba(30, 31, 48, 0.7) inset !important`,
                    WebkitTextFillColor: `${colors.grey[100]} !important`,
                  },
                  marginBottom: 1,
                }}
              />

              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
                sx={{
                  mt: 2,
                  height: { xs: "46px", sm: "50px" },
                  fontWeight: "medium",
                  fontSize: { xs: "0.95rem", sm: "1rem" },
                  borderRadius: "8px",
                  color: "#fff",
                  backgroundColor: colors.blueAccent[500],
                  boxShadow: "none",
                  textTransform: "none",
                  letterSpacing: "0.5px",
                  "&:hover": {
                    backgroundColor: colors.blueAccent[600],
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                  },
                  "&:active": {
                    transform: "translateY(1px)",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                  },
                  "&:disabled": {
                    backgroundColor: colors.grey[500],
                  },
                  transition: "all 0.2s ease",
                }}
                disabled={loading}
                endIcon={
                  loading && (
                    <Lottie
                      animationData={goingggg}
                      loop={true}
                      style={{
                        width: 70,
                        height: 70,
                        mixBlendMode: "multiply",
                      }}
                    />
                  )
                }
              >
                {!loading && (isRegister ? "Register" : "Login")}
              </Button>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mt={3}
                sx={{
                  border: `1px dashed ${theme.palette.mode === "dark" ? colors.blueAccent[400] : colors.primary[300]}`, // Blue border for better visibility
                  borderRadius: '12px',
                  backgroundColor: theme.palette.mode === "dark" ? "rgba(30, 31, 48, 0.8)" : colors.grey[100], // Darker background to match login inputs
                  boxShadow: theme.palette.mode === "dark" ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.05)",
                  padding: { xs: "16px", sm: "20px" },
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.mode === "dark" ? colors.blueAccent[200] : colors.primary[500], // Brighter blue for better visibility
                    textAlign: "center",
                    fontWeight: "bold",
                    mb: 1, // Slightly more margin
                    fontSize: { xs: "0.95rem", sm: "1rem" },
                    fontFamily: 'Bricolage Grotesque, Montserrat, Poppins, sans-serif',
                    textShadow: "0px 0px 1px rgba(0, 0, 0, 0.3)", // Subtle text shadow for better contrast
                  }}
                >
                  Don't have an account?
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === "dark" ? colors.grey[200] : colors.grey[700], // Much lighter color for better visibility
                    textAlign: "center",
                    mb: 0.5,
                    fontSize: { xs: "0.8rem", sm: "0.85rem" },
                    lineHeight: 1.4,
                    opacity: 1, // Full opacity for better visibility
                    fontWeight: 400, // Slightly bolder for better visibility
                    padding: "4px 8px", // Add padding
                    backgroundColor: "rgba(255, 255, 255, 0.05)", // Subtle background for better contrast
                    borderRadius: "4px", // Rounded corners
                    border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}`, // Subtle border
                  }}
                >
                  Create a secure account using your Telegram username
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === "dark" ? colors.greenAccent[200] : colors.greenAccent[600], // Brighter green for better visibility
                    textAlign: "center",
                    mb: 1.5,
                    fontSize: { xs: "0.8rem", sm: "0.85rem" },
                    fontStyle: "italic",
                    lineHeight: 1.3,
                    fontWeight: 500, // Bolder for better visibility
                    textShadow: "0px 0px 1px rgba(0, 0, 0, 0.3)", // Subtle text shadow for better contrast
                  }}
                >
                  Quick registration - takes less than 30 seconds!
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/register-guide")}
                  startIcon={<TelegramIcon sx={{ fontSize: { xs: "1rem", sm: "1.1rem" } }} />}
                  sx={{
                    textTransform: "none",
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
                    padding: { xs: "6px 12px", sm: "8px 16px" },
                    fontSize: { xs: "0.85rem", sm: "0.9rem" },
                    fontWeight: "medium",
                    borderRadius: "8px",
                    height: { xs: "36px", sm: "40px" },
                    transition: "all 0.2s ease",
                    width: "100%",
                  }}
                >
                  Register via Telegram Bot
                </Button>
              </Box>
            </Box>
          </form>
        )}
      </Formik>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSuccess ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const checkoutSchema = yup.object().shape({
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required"),
});

const initialValues = {
  username: "",
  password: "",
};

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}
