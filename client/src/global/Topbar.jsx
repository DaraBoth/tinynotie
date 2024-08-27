import React, { useState } from "react";
import { Box, IconButton, Typography, Menu, MenuItem, useTheme } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ShareIcon from "@mui/icons-material/Share";
import { useNavigate } from "react-router-dom";
import { tokens } from "../theme";
import { rspWidth } from "../responsive";
import GroupVisibilitySettings from "../component/GroupVisibilitySettings";

const Topbar = ({ groupInfo, setGroupInfo, onShareClick }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const titleFontSize = rspWidth("24px", "18px", "16px");

  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
    handleMenuClose();  // Close the menu when opening the settings dialog
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      padding="16px 24px"
      bgcolor={colors.primary[900]} // Match the background with the group page
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
          color: colors.grey[100], // Better visibility in both themes
          '&:hover': {
            backgroundColor: colors.blueAccent[700], // Consistent hover effect
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
          color: colors.grey[100], // Ensure title is visible in both themes
        }}
      >
        {groupInfo?.grp_name ?? groupInfo?.group_name}
      </Typography>

      {/* Menu Button */}
      <IconButton
        onClick={handleMenuClick}
        sx={{
          color: colors.grey[100], // Better visibility in both themes
          '&:hover': {
            backgroundColor: colors.blueAccent[700], // Consistent hover effect
          },
        }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={onShareClick}>
          <ShareIcon sx={{ marginRight: 1 }} /> Share
        </MenuItem>
        <MenuItem onClick={handleSettingsOpen}>
          <MoreVertIcon sx={{ marginRight: 1 }} /> Settings
        </MenuItem>
      </Menu>

      {/* Group Visibility Settings Dialog */}
      <GroupVisibilitySettings
        groupId={groupInfo?.id}
        currentVisibility={groupInfo?.visibility}
        open={settingsOpen}
        onClose={handleSettingsClose}
      />
    </Box>
  );
};

export default Topbar;
