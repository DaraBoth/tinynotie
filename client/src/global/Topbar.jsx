import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { ColorModeContext, tokens } from "../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";

const Topbar = ({groupInfo}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  return (
    <Box display="flex" justifyContent="space-between">

      {/* TITLE */}
      <Box
        // sx={{fontSize:"14px"}}
        display="flex"
        justifyContent="center"
        alignItems="center"
        fontSize="25px"
      >
         <Typography variant="h3">{groupInfo.grp_name ?? groupInfo.group_name}</Typography>
      </Box>
      <Box
        display="flex"
        gap="10px"
      >
        {/* ICONS */}
        <Box display="flex">
          <IconButton onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === "dark" ? (
              <DarkModeOutlinedIcon />
            ) : (
              <LightModeOutlinedIcon />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Topbar;
