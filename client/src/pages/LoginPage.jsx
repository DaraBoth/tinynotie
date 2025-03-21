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
import { tokens } from "../theme";
import { Alert } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import MeowFootprint from "../component/MeowFootprint";
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
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 3,
        background: colors.primary[900], // Using the darkest shade of primary color for background
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
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
                maxWidth: "500px",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                padding: 4,
                borderRadius: "12px",
                backgroundColor: colors.grey[900], // Dark grey background for the form
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)", // Slightly stronger shadow for contrast
              }}
            >
              <Typography
                variant="h4"
                color={colors.primary[500]}
                textAlign="center"
                fontWeight="bold"
              >
                {isRegister ? "Register" : "Login"} to{" "}
                <span style={{ color: colors.primary[300] }}>TinyNotie</span>
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person4RoundedIcon
                        style={{ color: colors.primary[300] }}
                      />
                    </InputAdornment>
                  ),
                  style: {
                    color: colors.primary[100], // Ensure the text color adapts to the theme
                  },
                }}
                sx={{
                  fontSize: "18px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: colors.primary[500], // Border color matching primary
                    },
                    "&:hover fieldset": {
                      borderColor: colors.primary[300], // Hover border color
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.primary[100], // Focused border color
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: colors.primary[500], // Label color
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 1000px ${colors.grey[900]} inset !important`,
                    WebkitTextFillColor: `${colors.primary[100]} !important`,
                    transition:
                      "background-color 5000s ease-in-out 0s !important",
                  },
                  "& input:-webkit-autofill:hover, & input:-webkit-autofill:focus":
                    {
                      WebkitBoxShadow: `0 0 0 1000px ${colors.grey[900]} inset !important`,
                      WebkitTextFillColor: `${colors.primary[100]} !important`,
                    },
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon
                        style={{ color: colors.primary[300] }}
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
                            style={{ color: colors.primary[300] }}
                          />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  style: {
                    color: colors.primary[100], // Ensure the text color adapts to the theme
                  },
                }}
                sx={{
                  fontSize: "18px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: colors.primary[500],
                    },
                    "&:hover fieldset": {
                      borderColor: colors.primary[300],
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.primary[100],
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: colors.primary[500],
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 1000px ${colors.grey[900]} inset !important`,
                    WebkitTextFillColor: `${colors.primary[100]} !important`,
                    transition:
                      "background-color 5000s ease-in-out 0s !important",
                  },
                  "& input:-webkit-autofill:hover, & input:-webkit-autofill:focus":
                    {
                      WebkitBoxShadow: `0 0 0 1000px ${colors.grey[900]} inset !important`,
                      WebkitTextFillColor: `${colors.primary[100]} !important`,
                    },
                }}
              />

              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
                sx={{
                  mt: 2,
                  height: "50px",
                  fontWeight: "bold",
                  fontSize: "18px",
                  borderRadius: "10px",
                  color: colors.primary[900], // Text color
                  backgroundColor: colors.primary[600], // Primary button color
                  "&:hover": {
                    backgroundColor: colors.primary[700], // Hover color
                  },
                  "&:disabled": {
                    backgroundColor: colors.grey[500], // Disabled color
                  },
                }}
                disabled={loading}
                endIcon={
                  loading && (
                    <Lottie
                      animationData={goingggg}
                      loop={true}
                      style={{
                        width: 90,
                        height: 90,
                        mixBlendMode: "multiply",
                      }}
                    />
                  )
                }
              >
                {!loading && (isRegister ? "Register" : "Login")}
              </Button>
              <Box display="flex" justifyContent="center" mt={2}>
                <Typography variant="body2" color={colors.grey[600]}>
                  {isRegister
                    ? "Already have an account?"
                    : "Don't have an account?"}
                </Typography>
                <Button
                  disableRipple
                  onClick={() => setIsRegister(!isRegister)}
                  sx={{
                    ml: 1,
                    textTransform: "none",
                    textDecoration: "underline",
                    color: colors.primary[300], // Link color
                    "&:hover": {
                      backgroundColor: "transparent",
                    },
                    padding: 0,
                    minHeight: "auto",
                    fontSize: "14px",
                    border: "none",
                  }}
                >
                  {isRegister ? "Login" : "Register"}
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
