import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { useContext } from "react";
import { ColorModeContext, tokens } from "../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate } from "react-router-dom";
import { rspWidth } from "../responsive";

const Topbar = ({ groupInfo ,setGroupInfo }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const titleFontSize = rspWidth("24px","18px","16px")

  return (
    <Box display="flex" justifyContent="center">
      <Box
        display="flex"
        gap="10px"
        flex="1"
      >
        {/* ICONS */}
        <Box display="flex">
          <IconButton
            onClick={() => {
              setGroupInfo(false)
              navigate('/');
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
        </Box>
      </Box>
      {/* TITLE */}
      <Box
        // sx={{fontSize:"14px"}}
        display="flex"
        justifyContent="center"
        alignItems="center"
        flex="1"
      >
        <Typography
          variant="h3"
          sx={{ cursor: "pointer" }}
          textAlign={'center'}
          color={colors.blueAccent[500]}
          fontSize={titleFontSize}
          fontWeight={700}
        >
          {groupInfo?.grp_name ?? groupInfo?.group_name}
        </Typography>
      </Box>
      <Box
        display="flex"
        gap="10px"
        justifyContent={'flex-end'}
        flex="1"
      >
        {/* ICONS */}
        {/* <Box display="flex">
          <IconButton onClick={colorMode.toggleColorMode}>
            {theme.palette.mode === "dark" ? (
              <DarkModeOutlinedIcon />
            ) : (
              <LightModeOutlinedIcon />
            )}
          </IconButton>
        </Box> */}
      </Box>
    </Box>
  );
};

export default Topbar;
