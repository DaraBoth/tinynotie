import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate, useLocation } from "react-router-dom";
import { usePostLoginMutation } from "../api/api";
import { tokens } from "../theme";

export default function Login({ setUser, setSecret }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [triggerLogin, resultLogin] = usePostLoginMutation();
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirectUrl = new URLSearchParams(search).get('redirect') || '/';

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
          setUser(username);
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
                    transition: "background-color 5000s ease-in-out 0s !important",
                  },
                  "& input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
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
                          <Visibility style={{ color: colors.primary[300] }} />
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
                    transition: "background-color 5000s ease-in-out 0s !important",
                  },
                  "& input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
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
                  backgroundColor: colors.primary[500], // Primary button color
                  "&:hover": {
                    backgroundColor: colors.primary[700], // Hover color
                  },
                  "&:disabled": {
                    backgroundColor: colors.grey[500], // Disabled color
                  },
                }}
                disabled={loading}
                startIcon={loading && <CircularProgress size="1rem" />}
              >
                {isRegister ? "Register" : "Login"}
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