import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens export
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#d1d1d1",
          200: "#a3a3a3",
          300: "#767676",
          400: "#595959",
          500: "#3c3c3c",
          600: "#2f2f2f",
          700: "#232323",
          800: "#181818",
          900: "#0e0e0e",
        },
        primary: {
          100: "#cfd1e4",
          200: "#9ea3c9",
          300: "#6d74af",
          400: "#4d5693",
          500: "#353a77", // adjusted to a more vibrant shade
          600: "#2b2e61",
          700: "#22234b",
          800: "#181835",
          900: "#0f0f1f",
        },
        greenAccent: {
          100: "#d0f5eb",
          200: "#a1ecd7",
          300: "#73e3c3",
          400: "#45daad",
          500: "#18d198", // more vibrant green accent
          600: "#14a67a",
          700: "#107b5b",
          800: "#0c523d",
          900: "#07291e",
        },
        redAccent: {
          100: "#ffe3e2",
          200: "#ffc7c4",
          300: "#ffaba7",
          400: "#ff8f89",
          500: "#ff726c", // softer red to reduce strain on dark background
          600: "#cc5b56",
          700: "#994340",
          800: "#662c2b",
          900: "#331615",
        },
        blueAccent: {
          100: "#dce4ff",
          200: "#b9c9ff",
          300: "#97adff",
          400: "#7481ff",
          500: "#5276ff", // slightly more vibrant blue accent
          600: "#415fcc",
          700: "#314799",
          800: "#213066",
          900: "#111833",
        },
        background: "#121212", // dark background with a softer black
      }
    : {
        grey: {
          100: "#f7f7f7",
          200: "#e4e4e4",
          300: "#d0d0d0",
          400: "#bcbcbc",
          500: "#a8a8a8",
          600: "#858585",
          700: "#616161",
          800: "#3e3e3e",
          900: "#1a1a1a",
        },
        primary: {
          100: "#e0f7ff",
          200: "#b3eaff",
          300: "#86ddff",
          400: "#5acfff", // lighter and more lively blue for primary
          500: "#2dc2ff", // main primary color (soft and bright blue)
          600: "#24a0cc",
          700: "#1b7d99",
          800: "#125b66",
          900: "#093733",
        },
        greenAccent: {
          100: "#e6f7f1",
          200: "#ccf0e4",
          300: "#b3e9d7",
          400: "#99e2ca",
          500: "#80dabe", // bright and soft green
          600: "#66b493",
          700: "#4d8d69",
          800: "#336640",
          900: "#1a3220",
        },
        redAccent: {
          100: "#ffeae9",
          200: "#ffc7c4",
          300: "#ff9f9e",
          400: "#ff7977", // lighter red with less aggression
          500: "#ff5251", // soft red that complements light mode
          600: "#cc4241",
          700: "#993131",
          800: "#661f20",
          900: "#330f10",
        },
        blueAccent: {
          100: "#f0f5ff",
          200: "#d6e3ff",
          300: "#bcd2ff",
          400: "#a2c0ff",
          500: "#89afff", // softer blue accent
          600: "#6e8ccc",
          700: "#536999",
          800: "#384666",
          900: "#1d2333",
        },
        background: "#ffffff", // bright and clean white background
      }),
});

// mui theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      background: {
        default: colors.background.default, // Unified background
        paper: colors.grey[800], // Paper background
      },
      primary: {
        main: colors.primary[500],
      },
      secondary: {
        main: colors.blueAccent[400],
      },
    },
    typography: {
      fontFamily: "Source Sans Pro, sans-serif",
      body1: {
        color: colors.primary[100],
      },
      h4: {
        color: colors.primary[100],
        fontWeight: 600,
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "8px", // Unified button radius
            padding: "10px 20px",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: colors.grey[800],
            borderRadius: "12px",
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: "50%",
          },
        },
      },
    },
  };
};

// context for color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const [mode, setMode] = useState("light");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  return [theme, colorMode, setMode];
};
