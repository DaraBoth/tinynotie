import { Box, IconButton, Typography, useTheme } from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate } from "react-router-dom";
import { tokens } from "../theme";
import { rspWidth } from "../responsive";

const Topbar = ({ groupInfo, setGroupInfo }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const titleFontSize = rspWidth("24px", "18px", "16px");

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      padding="16px 24px"
    >
      {/* Back Button */}
      <IconButton
        onClick={() => {
          setGroupInfo(false);
          navigate('/');
        }}
        sx={{
          color: colors.grey[100],
          '&:hover': {
            backgroundColor: colors.blueAccent[700],
          },
        }}
      >
        <ArrowBackIosNewIcon />
      </IconButton>

      {/* Title */}
      <Typography
        variant="h3"
        sx={{ cursor: "pointer" }}
        textAlign="center"
        color={colors.grey[100]}
        fontSize={titleFontSize}
        fontWeight={700}
        flexGrow={1}
      >
        {groupInfo?.grp_name ?? groupInfo?.group_name}
      </Typography>
    </Box>
  );
};

export default Topbar;
