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
      ...(mode === "dark"
        ? {
            // palette values for dark mode
            primary: {
              main: colors.primary[500],
            },
            secondary: {
              main: colors.blueAccent[400],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.background,
            },
          }
        : {
            // palette values for light mode
            primary: {
              main: colors.primary[500],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: "#f4f4f4", // softer background for light mode
            },
          }),
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 14,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@global': {
            'input:-webkit-autofill': {
              WebkitBoxShadow: `0 0 0 1000px ${colors.background} inset !important`,
              WebkitTextFillColor: `${colors.primary[700]} !important`,
              transition: "background-color 5000s ease-in-out 0s !important",
            },
            'input:-webkit-autofill:hover, input:-webkit-autofill:focus': {
              WebkitBoxShadow: `0 0 0 1000px ${colors.background} inset !important`,
              WebkitTextFillColor: `${colors.primary[700]} !important`,
            },
            'input:-webkit-autofill::first-line': {
              fontFamily: "Source Sans Pro, sans-serif",
              fontSize: "inherit",
              color: `${colors.primary[700]} !important`,
            },
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "dark" ? colors.grey[800] : colors.grey[200], // Adjust background
            borderColor: mode === "dark" ? colors.grey[700] : colors.grey[400], // Adjust border color
          },
          columnHeaders: {
            backgroundColor: mode === "dark" ? colors.primary[400] : colors.primary[300], // Adjust header background
            color: colors.grey[100],
          },
          cell: {
            color: mode === "dark" ? colors.grey[200] : colors.grey[900], // Ensure text is visible
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
