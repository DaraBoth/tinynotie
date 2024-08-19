import React, { useEffect, useState } from 'react';
import {
  Box, Button, IconButton, InputAdornment, Snackbar, TextField, Typography, useMediaQuery, useTheme, CircularProgress
} from '@mui/material';
import { Formik } from 'formik';
import * as yup from "yup";
import { usePostLoginMutation, usePostRegisterMutation } from '../api/api';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Person4RoundedIcon from '@mui/icons-material/Person4Rounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { tokens } from '../theme';
import { Alert } from '@mui/material';

export default function Login({ setUser, setSecret }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
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
            response = await triggerRegister({ usernm: username, passwd: password }).unwrap();
            if (response.status) {
                setSnackbarMessage("Registration successful! Please login.");
                setSnackbarSuccess(true);
                setIsRegister(false);
            } else {
                setSnackbarMessage(response.message || "Registration failed. Please try again.");
                setSnackbarSuccess(false);
            }
        } else {
            response = await triggerLogin({ usernm: username, passwd: password }).unwrap();
            if (response.status) {
                setSnackbarMessage("Login successful!");
                setSnackbarSuccess(true);
                setUser(username);
                setSecret(response._id);
            } else {
                setSnackbarMessage(response.message || "Login failed. Please check your credentials.");
                setSnackbarSuccess(false);
            }
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
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3,
      }}
    >
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
        validateOnChange
        validateOnBlur
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                maxWidth: isNonMobile ? '400px' : '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: 3,
                borderRadius: '8px',
                backgroundColor: colors.grey[50],
              }}
            >
              <Typography variant="h4" color={colors.primary.main} textAlign="center" fontWeight="bold">
                {isRegister ? "Register" : "Login"} to <span style={{ color: colors.blueAccent[500] }}>TinyNotie</span>
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
                      <Person4RoundedIcon />
                    </InputAdornment>
                  ),
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
                      <LockOutlinedIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
                sx={{
                  mt: 2,
                  height: '40px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  borderRadius: '8px',
                }}
                disabled={loading}
                startIcon={loading && <CircularProgress size="1rem" />}
              >
                {isRegister ? 'Register' : 'Login'}
              </Button>
              <Box display="flex" justifyContent="center" mt={2}>
                <Typography variant="body2" color={colors.grey[600]}>
                  {isRegister ? "Already have an account?" : "Don't have an account?"}
                </Typography>
                <Button
                  disableRipple
                  onClick={() => setIsRegister(!isRegister)}
                  sx={{
                    ml: 1,
                    textTransform: 'none',
                    textDecoration: 'underline',
                    color: colors.blueAccent[500],
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                    padding: 0,
                    minHeight: 'auto',
                    fontSize: '14px',
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
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSuccess ? "success" : "error"} sx={{ width: '100%' }}>
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
