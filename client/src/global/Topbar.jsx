import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate } from "react-router-dom";
import { rspWidth } from "../responsive";

const Topbar = ({ groupInfo, setGroupInfo }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const titleFontSize = () => {return rspWidth("24px", "18px", "16px")};

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
        justifyContent="flex-end"
        alignItems="center"
        flex="1"
        paddingRight={'10px'}
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
    </Box>
  );
};

export default Topbar;
