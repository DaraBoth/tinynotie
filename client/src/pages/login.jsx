import { Box, Button, TextField, useMediaQuery } from '@mui/material';
import { Formik } from 'formik';
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import * as yup from "yup";
import { usePostLoginMutation } from '../api/api'
const baseURL = import.meta.env.VITE_BASE_URL;

export default function Login({ setUser, setSecret }) {
  const isNonMobile = useMediaQuery("(min-width:600px)");

  const [username, setUsername] = useState("");
  const [triggerLogin, resultLogin] = usePostLoginMutation();

  const handleFormSubmit = debounce(async (values) => {
    triggerLogin({ usernm:values.username, passwd:values.password });
    setUsername(values.username);
  }, 500);

  useEffect(() => {
    if (resultLogin.data?.status) {
      setUser(username);
      setSecret(resultLogin.data._id);
    }
  }, [resultLogin.data]); // eslint-disable-line

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
              width='280px'
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(2, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 2" },
              }}
            >
              <TextField
                fullWidth
                variant="filled"
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
                variant="filled"
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
              justifyContent="flex-end"
              gap="5px"
              marginTop='5px'
              >
              <Button onClick={handleSubmit} type="button" color="info" variant="contained" >
                Login
              </Button>
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