import React, { useEffect, useState } from 'react'
import { Box, CssBaseline, IconButton, ThemeProvider, useTheme } from '@mui/material';
import { ColorModeContext, useMode } from './theme';
import './index.scss'
import { tokens } from './theme'
import Login from './pages/login';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Group from './pages/group';
import Home from './pages/home';
import CreateGroup from './pages/creategroup';
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ThemeSwitcher from './component/ThemeSwitcher';

function App() {
  const [theme, colorMode, setMode] = useMode();
  const themes = useTheme();
  const colors = tokens(themes.palette.mode);
  const [user, setUser] = useState(() => sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null);
  const [secret, setSecret] = useState(() => sessionStorage.getItem('secret') ? sessionStorage.getItem('secret') : null);
  const [groupInfo, setGroupInfo] = useState(null);
  const isAuth = Boolean(user) && Boolean(secret);
  const isGroup = isAuth && Boolean(groupInfo);
  let themeDefault = sessionStorage.getItem("theme");

  useEffect(() => {
    themeDefault && setMode(themeDefault);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("theme", theme.palette.mode);
  }, [theme.palette.mode]);

  useEffect(() => {
    if (isAuth) {
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('secret', secret);
    } else {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('secret');
    }
  }, [user, secret, isAuth]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ColorMode theme={theme} colorMode={colorMode} colors={colors} />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                isAuth ? (
                  <Home user={user} setUser={setUser} secret={secret} setGroupInfo={setGroupInfo} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path='/login' element={
              isAuth ? (
                <Navigate to="/" />
              ) : (
                <Login setUser={setUser} setSecret={setSecret} />
              )
            } />
            <Route
              path="/group"
              element={
                isGroup ? (
                  <Group user={user} secret={secret} groupInfo={groupInfo} setGroupInfo={setGroupInfo} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/creategroup"
              element={
                isAuth ? (
                  <CreateGroup secret={secret} setGroupInfo={setGroupInfo} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default App

const ColorMode = ({theme, colorMode, colors}) => {
  return (
    <Box
      position={'fixed'}
      bottom={'15px'}
      left={'15px'}
      zIndex={5}
      sx={{
        borderRadius: '50%',
        boxShadow: `inset 0px 0px 1px 2px ${theme.palette.mode === "light" ? colors.blueAccent[500] : undefined}`,
        backgroundColor: theme.palette.mode === "dark" ? colors.blueAccent[500] : '#fff'
      }}
    >
      <IconButton onClick={colorMode.toggleColorMode}>
        {theme.palette.mode === "dark" ? (
          <DarkModeOutlinedIcon />
        ) : (
          <LightModeOutlinedIcon
            sx={{
              fill: colors.blueAccent[500]
            }}
          />
        )}
      </IconButton>
    </Box>
  )
}
