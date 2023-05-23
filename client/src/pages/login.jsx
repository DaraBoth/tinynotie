import { Alert, AlertTitle, Box, Button, IconButton, InputAdornment, Snackbar, TextField, Typography, styled, useMediaQuery, useTheme } from '@mui/material';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import * as yup from "yup";
import LoadingButton from '@mui/lab/LoadingButton';
import { usePostLoginMutation, usePostRegisterMutation } from '../api/api';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Person4RoundedIcon from '@mui/icons-material/Person4Rounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { tokens } from '../theme'
import { rspWidth } from '../responsive';

export default function Login({ setUser, setSecret }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [triggerLogin, resultLogin] = usePostLoginMutation();
  const [triggerRegister, resultRegister] = usePostRegisterMutation();
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [isErrorServer, setIsErrorServer] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [durationMsg, setDurationMsg] = useState(3000);
  const [count,setCount] = useState(1);


  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleFormSubmit = debounce(async (values, { resetForm }) => {
    if (isRegister) {
      setLoadingLogin(true);
      triggerRegister({ usernm: values.username, passwd: values.password })
    } else {
      setLoadingLogin(true);
      triggerLogin({ usernm: values.username, passwd: values.password });
      setUsername(values.username);
    }
    resetForm();
    handleServerError(2);
  }, 500);

  useEffect(() => {
    if (resultLogin.data?.status) {
      setMessage("Success login to " + username)
      setSuccess(true);
      setOpen(true);
      setLoadingLogin(false);
      setUser(username);
      setSecret(resultLogin.data._id);
    }
    if (resultLogin.data?.status === false) {
      setMessage(resultLogin.data?.message);
      setSuccess(false);
      setOpen(true);
      setLoadingLogin(false);
    }
  }, [resultLogin.data]); // eslint-disable-line

  useEffect(() => {
    if (resultRegister.data?.status) {
      setMessage("Register is success!")
      setSuccess(true);
      setOpen(true);
      setIsRegister(false);
      setLoadingLogin(false);
    }
    if (resultRegister.data?.status === false) {
      setMessage(resultRegister.data?.message);
      setSuccess(false);
      setOpen(true);
      setLoadingLogin(false);
    }
  }, [resultRegister.data]); // eslint-disable-line

  const handleServerError = (second) => {
    let min = second;
    setTimeout(()=>{
      if(min===1) {
        setCount(count+1)
        return false;
      }else{
        handleServerError(min-1);
      }
    },6000);
  }

  useEffect(()=>{
    if(count===2 && loadingLogin === true){
      setMessage(`Sorry our service is unaviable right now! Please contact your admin.`);
      setDurationMsg(6000);
      setSuccess(false);
      setOpen(true);
      setLoadingLogin(false);
      setCount(1);
    }
  },[count])

  return (
    <Box sx={{
      width: '100%',
      height: '100vh',
      minHeight: '50vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }} >

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
        }) => (
          <form>
            <Box
              display={'flex'}
              flexDirection={'column'}
              justifyContent={'center'}
              gap={"15px"}
            >
              <Typography
                sx={{
                  textAlign: 'center'
                }}
                variant='h3' >
                <span style={{ color: colors.blueAccent[500] }} >TinyNotie</span>
              </Typography>
              <Box
                width={rspWidth("320px", "280px", "260px")}
                display="grid"
                gap="15px"
                gridTemplateColumns="repeat(2, minmax(0, 1fr))"
                sx={{
                  "& > div": { gridColumn: isNonMobile ? undefined : "span 2" },
                }}
              >
                <TextField
                  fullWidth
                  variant="standard"
                  type="text"
                  label="Username"
                  onChange={handleChange}
                  value={values.username}
                  name="username"
                  color="info"
                  error={!!touched.username && !!errors.username}
                  helperText={touched.username && errors.username}
                  sx={{ gridColumn: "span 4" }}
                  InputProps={{
                    startAdornment:(
                      <InputAdornment position="start">
                        <Person4RoundedIcon/>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  variant="standard"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  onChange={handleChange}
                  value={values.password}
                  name="password"
                  color="info"
                  error={!!touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                  sx={{ gridColumn: "span 4" }}
                  InputProps={{
                    startAdornment:(
                      <InputAdornment position="start">
                        <LockOutlinedIcon/>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setShowPassword(!showPassword)
                        }}
                        position="end">
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </InputAdornment>
                    ),
                  }}
                />

              </Box>
              <Box>
                <LoadingButton
                  sx={{ width: "100%", color: colors.blueAccent[500], borderColor: colors.blueAccent[500] }}
                  loading={loadingLogin ? true : false}
                  onClick={handleSubmit}
                  type="button"
                  variant="outlined" >
                  {isRegister ? 'Register' : 'Login'}
                </LoadingButton>
              </Box>
              <Box
                display="flex"
                justifyContent="center"
              >
                <Typography
                  variant='subtitle2'
                  style={{ color: colors.grey[500] }}
                > {isRegister ? 'Already have an account?' : "Don't have an account?"}
                  <Button
                    disableRipple
                    sx={{
                      "&:hover": {
                        boxShadow: `none`,
                        backgroundColor: 'none',
                        background: 'none'
                      },
                      padding: '0px',
                      minWidth: '0px',
                      marginLeft: '5px',
                      textAlign: 'left',
                      textTransform: 'capitalize',
                      textDecoration: 'underline'
                    }}
                    type="button"
                    onClick={() => {
                      setIsRegister(!isRegister)
                    }}
                    color="info"
                    variant="text"
                    title={isRegister ? "Login" : "Register"} >
                    {isRegister ? "Login" : "Register"}
                  </Button>
                </Typography>
              </Box>
            </Box>
          </form>
        )}
      </Formik>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={open}
        autoHideDuration={durationMsg}
        onClose={handleClose}>
        <Alert onClose={handleClose} severity={success ? "success" : "error"} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
const checkoutSchema = yup.object().shape({
  username: yup.string().required("required"),
  password: yup.string().required("required")
});
const initialValues = {
  username: "",
  password: "",
};

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}


