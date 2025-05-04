import React, { useEffect, useState } from "react";
import { CssBaseline, Fab, ThemeProvider, useTheme } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import "./index.scss";
import { tokens } from "./theme";
import Login from "./pages/LoginPage";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import Group from "./pages/GroupPage";
import Home from "./pages/HomePage";
import CreateGroup from "./pages/CreateGroupPage";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import TranslatePage from "./pages/TranslatePage";
import useServiceWorker from "./component/useServiceWorker";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterGuide from "./pages/RegisterGuide";
import Lottie from "lottie-react";
import moon from "./assets/moon.json";
import sun from "./assets/sun.json";

function App() {
  const [theme, colorMode, setMode] = useMode();
  const themes = useTheme();
  const colors = tokens(themes.palette.mode);
  const [user, setUser] = useState(() =>
    sessionStorage.getItem("user")
      ? JSON.parse(sessionStorage.getItem("user"))
      : null
  );
  const [secret, setSecret] = useState(() =>
    sessionStorage.getItem("secret") ? sessionStorage.getItem("secret") : null
  );
  const [groupInfo, setGroupInfo] = useState(null);
  const isAuth = Boolean(user) && Boolean(secret);

  const { registerServiceWorker, requestNotificationPermission } =
    useServiceWorker();

  let themeDefault = sessionStorage.getItem("theme");

  useEffect(() => {
    themeDefault && setMode(themeDefault);
    registerServiceWorker();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("theme", theme.palette.mode);
    document.body.style.backgroundColor = colors.primary[900];
  }, [theme.palette.mode]);

  useEffect(() => {
    if (isAuth) {
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("secret", secret);
    } else {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("secret");
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
                  <Home
                    user={user}
                    setUser={setUser}
                    secret={secret}
                    setGroupInfo={setGroupInfo}
                    requestNotificationPermission={
                      requestNotificationPermission
                    }
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/login"
              element={
                isAuth ? (
                  <Navigate to="/" />
                ) : (
                  <Login setUser={setUser} setSecret={setSecret} />
                )
              }
            />
            <Route
              path="/group/:groupParam"
              element={
                <Group
                  user={user}
                  secret={secret}
                  setGroupInfo={setGroupInfo}
                />
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
            <Route path="/translate" element={<TranslatePage />} />
            <Route path="/register-guide" element={<RegisterGuide />} />
            <Route path="/*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;

const ColorMode = ({ theme, colorMode, colors }) => {
  return (
    <Fab
      color="primary"
      onClick={colorMode.toggleColorMode}
      sx={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        backgroundColor:
          theme.palette.mode === "dark"
            ? colors.primary[500]
            : colors.grey[100], // Adjust background based on theme
        color:
          theme.palette.mode === "dark"
            ? colors.grey[900]
            : colors.primary[500], // Adjust icon color based on theme
        "&:hover": {
          backgroundColor:
            theme.palette.mode === "dark"
              ? colors.primary[700]
              : colors.grey[300], // Darken background on hover
        },
        // boxShadow: `0px 3px 10px rgba(0, 0, 0, 0.2)`, // Similar shadow to other Fabs
        transition: "background-color 0.3s ease", // Smooth transition
      }}
    >
      <Lottie
        animationData={theme.palette.mode === "dark" ? moon : sun}
        loop={true}
        style={{
          width: 150,
          height: 150,
        }}
      />
    </Fab>
  );
};
