import { Box, Button, IconButton, InputAdornment, TextField, Typography, styled, useMediaQuery } from '@mui/material';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import * as yup from "yup";
import LoadingButton from '@mui/lab/LoadingButton';
import { usePostLoginMutation, usePostRegisterMutation } from '../api/api';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function Login({ setUser, setSecret }) {
  const isNonMobile = useMediaQuery("(min-width:600px)");

  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [triggerLogin, resultLogin] = usePostLoginMutation();
  const [triggerRegister, resultRegister] = usePostRegisterMutation();
  const [loadingLogin, setLoadingLogin] = useState(false);

  const InputAdornment = styled('div')`
  margin: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

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
  }, 500);

  useEffect(() => {
    if (resultLogin.data?.status) {
      setUser(username);
      setSecret(resultLogin.data._id);
      setLoadingLogin(false);
    }
    if (resultLogin.data?.status == false) {
      alert(resultLogin.data?.message)
      setLoadingLogin(false);
    }
  }, [resultLogin.data]); // eslint-disable-line

  useEffect(() => {
    if (resultRegister.data?.status) {
      setIsRegister(false);
      setLoadingLogin(false);
    }
    if (resultRegister.data?.status == false) {
      alert(resultRegister.data?.message)
      setLoadingLogin(false);
    }
  }, [resultRegister.data]); // eslint-disable-line

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
            <Typography
              sx={{
                marginBottom: '5px',
                textAlign: 'center'
              }}
              variant='h3' >
              <span style={{ color: '#f1f1f1' }} >TinyNotie</span>
            </Typography>
            <Box
              width='270px'
              display="grid"
              gap="30px"
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
              />
              <TextField
                fullWidth
                variant="standard"
                type="password"
                label="Password"
                onChange={handleChange}
                value={values.password}
                name="password"
                color="info"
                error={!!touched.password && !!errors.password}
                helperText={touched.password && errors.password}
                sx={{ gridColumn: "span 4" }}
              />

            </Box>
            <Box
              display="flex"
              justifyContent="space-between"
              gap="5px"
              marginTop='5px'
            >
              <Typography
                variant='subtitle2'
                style={{ color: '#f1f1f1' }}
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
              <LoadingButton loading={loadingLogin ? true : false} onClick={handleSubmit} type="button" color="info" variant="outlined" >
                {isRegister ? 'Register' : 'Login'}
              </LoadingButton>
            </Box>
          </form>
        )}
      </Formik>
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

