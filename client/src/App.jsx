import React, { useState } from 'react'
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

function App() {
  const [theme, colorMode] = useMode();
  const themes = useTheme();
  const colors = tokens(themes.palette.mode);
  const [user, setUser] = useState(null);
  const [secret, setSecret] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const isAuth = Boolean(user) && Boolean(secret);
  const isGroup = isAuth && Boolean(groupInfo);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          position={'fixed'}
          bottom={'15px'}
          right={'15px'}
          zIndex={5}
          sx={{
            borderRadius: '50%',
            boxShadow: `inset 0px 0px 1px 2px ${theme.palette.mode === "light" ? colors.blueAccent[500] : undefined}`,
            backgroundColor: theme.palette.mode === "dark" ? colors.blueAccent[500] : '#fff'
          }}
        >
          <IconButton onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === "dark" ? (
              <DarkModeOutlinedIcon/>
            ) : (
              <LightModeOutlinedIcon
                sx={{
                  fill:colors.blueAccent[500]
                }}
              />
            )}
          </IconButton>
        </Box>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                isAuth ? (
                  isGroup ? (
                    <Navigate to="/group" />
                  ) : (
                    <Home user={user} secret={secret} setGroupInfo={setGroupInfo} />
                  )
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
