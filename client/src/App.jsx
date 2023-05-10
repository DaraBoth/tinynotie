import React, { useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ColorModeContext, useMode } from './theme';
import './index.scss'
import Login from './pages/login';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Group from './pages/group';
import Home from './pages/home';
import CreateGroup from './pages/creategroup';

function App() {
  const [theme, colorMode] = useMode();
  const [user, setUser] = useState(null);
  const [secret, setSecret] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const isAuth = Boolean(user) && Boolean(secret);
  const isGroup = isAuth && Boolean(groupInfo);
  
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
                  <Group user={user} secret={secret} groupInfo={groupInfo} />
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
