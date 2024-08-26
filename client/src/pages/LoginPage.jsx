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
  const location = useLocation();

  const handleFormSubmit = debounce(async (values, { resetForm }) => {
    setLoading(true);
    const { username, password } = values;

    try {
      const response = await triggerLogin({ usernm: username, passwd: password }).unwrap();

      if (response.status) {
        setSnackbarMessage("Login successful!");
        setSnackbarSuccess(true);
        setUser(username);
        setSecret(response._id);

        // Redirect to the original page or home
        const redirectUrl = new URLSearchParams(location.search).get("redirect");
        navigate(redirectUrl || "/");
      } else {
        setSnackbarMessage(response.message || "Login failed. Please check your credentials.");
        setSnackbarSuccess(false);
      }
      resetForm();
    } catch (error) {
      setSnackbarMessage(error.data?.message || "An error occurred. Please try again.");
      setSnackbarSuccess(false);
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  }, 500);

  return (
    <Box sx={{ /* Your existing styles */ }}>
      <Formik onSubmit={handleFormSubmit} initialValues={initialValues} validationSchema={checkoutSchema}>
        {/* Your form implementation */}
      </Formik>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSuccess ? "success" : "error"}>
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