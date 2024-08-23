import { Box, IconButton, Typography, useTheme } from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ShareIcon from '@mui/icons-material/Share';
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
      bgcolor="transparent" // Making the background transparent
      sx={{
        boxShadow: 'none',
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={() => {
          setGroupInfo(false);
          navigate('/');
        }}
        sx={{
          color: colors.grey[700], // Adjusted for better visibility in light theme
          '&:hover': {
            backgroundColor: colors.blueAccent[100], // Lighter hover effect
          },
        }}
      >
        <ArrowBackIosNewIcon />
      </IconButton>

      {/* Title */}
      <Typography
        variant="h3"
        textAlign="center"
        fontSize={titleFontSize}
        fontWeight={700}
        flexGrow={1}
        sx={{ 
          color: colors.primary[500], // Ensure title is visible in both themes
        }}
      >
        {groupInfo?.grp_name ?? groupInfo?.group_name}
      </Typography>

      {/* Share Button */}
      <IconButton
        onClick={() => {
          // Implement the share functionality here
        }}
        sx={{
          color: colors.grey[700], // Adjusted for better visibility in light theme
          '&:hover': {
            backgroundColor: colors.blueAccent[100], // Lighter hover effect
          },
        }}
      >
        <ShareIcon />
      </IconButton>
    </Box>
  );
};

export default Topbar;
