import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens export
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#e0e0e0", // Lighten grey for better contrast
          200: "#b3b3b3",
          300: "#808080",
          400: "#4d4d4d",
          500: "#333333",
          600: "#292929",
          700: "#1f1f1f",
          800: "#141414",
          900: "#0a0a0a",
        },
        primary: {
          100: "#e3e4ff", // Lighten for better contrast
          200: "#c7c9ff",
          300: "#acafee",
          400: "#9294dd",
          500: "#787bd4", // Slightly more vibrant
          600: "#5f61a8",
          700: "#46497b",
          800: "#2d3050",
          900: "#141727",
        },
        greenAccent: {
          100: "#d0f5eb",
          200: "#a1ecd7",
          300: "#73e3c3",
          400: "#45daad",
          500: "#18d198", // More vibrant green accent
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
          500: "#ff726c", // Softer red for reduced strain on dark background
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
          500: "#5276ff", // Slightly more vibrant blue accent
          600: "#415fcc",
          700: "#314799",
          800: "#213066",
          900: "#111833",
        },
        background: "#121212", // Dark background with a softer black
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
          400: "#5acfff", // Lighter and more lively blue for primary
          500: "#2dc2ff", // Main primary color (soft and bright blue)
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
          500: "#80dabe", // Bright and soft green
          600: "#66b493",
          700: "#4d8d69",
          800: "#336640",
          900: "#1a3220",
        },
        redAccent: {
          100: "#ffeae9",
          200: "#ffc7c4",
          300: "#ff9f9e",
          400: "#ff7977", // Lighter red with less aggression
          500: "#ff5251", // Soft red that complements light mode
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
          500: "#89afff", // Softer blue accent
          600: "#6e8ccc",
          700: "#536999",
          800: "#384666",
          900: "#1d2333",
        },
        background: "#ffffff", // Bright and clean white background
      }),
});

// MUI theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      background: {
        default: colors.background, // Correctly applies the background color based on the mode
        paper: mode === "dark" ? colors.grey[800] : colors.grey[100], // Dark mode paper background should be darker
      },
      primary: {
        main: colors.primary[500],
      },
      secondary: {
        main: colors.blueAccent[400],
      },
      text: {
        primary: mode === "dark" ? colors.grey[100] : colors.grey[900], // Adjust text color based on the mode
        secondary: mode === "dark" ? colors.grey[300] : colors.grey[700],
      },
    },
    typography: {
      fontFamily: "Source Sans Pro, sans-serif",
      body1: {
        color: mode === "dark" ? colors.grey[100] : colors.grey[900], // Adjust body text color
      },
      h4: {
        color: mode === "dark" ? colors.primary[200] : colors.primary[700], // Adjust heading color
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
            borderRadius: "8px",
            padding: "10px 20px",
            color: mode === "dark" ? colors.grey[100] : colors.grey[900], // Adjust button text color
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "dark" ? colors.grey[800] : colors.grey[100], // Conditional based on mode
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
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: mode === "dark" ? colors.grey[100] : colors.grey[900], // Adjust input text color
          },
        },
      },
    },
  };
};

// Context for color mode
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