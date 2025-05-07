import React, { useState, useCallback, memo, useEffect } from "react";
import {
  Box,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  useTheme,
  Tooltip,
  useMediaQuery,
  Slide,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ShareIcon from "@mui/icons-material/Share";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FlipIcon from "@mui/icons-material/Flip";
import { useNavigate } from "react-router-dom";
import { tokens } from "../theme";
import { rspWidth } from "../responsive";
import GroupVisibilitySettings from "../component/GroupVisibilitySettings";

const Topbar = memo(({ groupInfo, setGroupInfo, onShareClick, onScannerClick }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const titleFontSize = rspWidth("20px", "18px", "16px");
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState(null);

  // Handle scroll events to change topbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Use useCallback to memoize event handlers
  const handleMenuClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSettingsOpen = useCallback(() => {
    setSettingsOpen(true);
    handleMenuClose(); // Close the menu when opening the settings dialog
  }, [handleMenuClose]);

  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const handleBackClick = useCallback(() => {
    try {
      setGroupInfo(null);
      navigate("/");
    } catch (err) {
      console.error("Navigation error:", err);
      setError("Failed to navigate back. Please try again.");
    }
  }, [navigate, setGroupInfo]);

  return (
    <Slide appear={false} direction="down" in={!scrolled || isMobile}>
      <Box
        component={motion.div}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '12px 16px' : '14px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backdropFilter: 'blur(10px)',
          backgroundColor: scrolled
            ? theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.85)'
              : 'rgba(255, 255, 255, 0.85)'
            : theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.6)'
              : 'rgba(255, 255, 255, 0.6)',
          borderBottom: scrolled
            ? `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)'}`
            : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Left section with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleBackClick}
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '12px',
              padding: '8px',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Center section with title */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            px: 2,
          }}
        >
          <Typography
            variant="h6"
            component="h1"
            noWrap
            sx={{
              fontWeight: 600,
              fontSize: titleFontSize,
              color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
              fontFamily: 'Bricolage Grotesque, Montserrat, Poppins, sans-serif',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: isMobile ? '180px' : '300px',
              textShadow: theme.palette.mode === 'dark'
                ? '0px 1px 2px rgba(0, 0, 0, 0.3)'
                : 'none',
            }}
          >
            {groupInfo?.grp_name ?? groupInfo?.group_name ?? "TinyNotie"}
          </Typography>
        </Box>

        {/* Error message if navigation fails */}
        {error && (
          <Typography
            variant="caption"
            color="error"
            sx={{
              position: 'absolute',
              top: '50px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '4px 8px',
              borderRadius: '4px',
              zIndex: 1000
            }}
          >
            {error}
          </Typography>
        )}

        {/* Right section with menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tooltip title="More options">
            <IconButton
              onClick={handleMenuClick}
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                padding: '8px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                mt: 1.5,
                overflow: 'visible',
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(20, 23, 39, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: "blur(10px)",
                borderRadius: "16px",
                padding: "8px",
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)'}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 10px 25px rgba(0, 0, 0, 0.5)'
                  : '0 10px 25px rgba(0, 0, 0, 0.1)',
                minWidth: 200,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(20, 23, 39, 0.9)'
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: "blur(10px)",
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  borderBottom: 'none',
                  borderRight: 'none',
                },
              }
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* Subtle gradient overlay for depth */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "40px",
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              zIndex: 0,
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              pointerEvents: "none",
            }}
          />

          {groupInfo?.isAdmin && (
            <MenuItem
              onClick={onScannerClick}
              sx={{
                borderRadius: '10px',
                mx: 0.5,
                my: 0.5,
                fontSize: '0.9rem',
                padding: "10px 16px",
                position: "relative",
                zIndex: 1,
                transition: "all 0.2s ease",
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(0, 123, 255, 0.15)'
                    : 'rgba(0, 123, 255, 0.1)',
                  borderRadius: "8px",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 1.5
                }}
              >
                <FlipIcon
                  sx={{
                    color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                    fontSize: "1.1rem"
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: "0.9rem",
                }}
              >
                Scan Receipt
              </Typography>
            </MenuItem>
          )}

          <MenuItem
            onClick={onShareClick}
            sx={{
              borderRadius: '10px',
              mx: 0.5,
              my: 0.5,
              fontSize: '0.9rem',
              padding: "10px 16px",
              position: "relative",
              zIndex: 1,
              transition: "all 0.2s ease",
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
                transform: "translateY(-1px)",
              },
            }}
          >
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(0, 123, 255, 0.15)'
                  : 'rgba(0, 123, 255, 0.1)',
                borderRadius: "8px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 1.5
              }}
            >
              <ShareIcon
                sx={{
                  color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                  fontSize: "1.1rem"
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: "0.9rem",
              }}
            >
              Share
            </Typography>
          </MenuItem>

          {groupInfo?.isAdmin && (
            <MenuItem
              onClick={handleSettingsOpen}
              sx={{
                borderRadius: '10px',
                mx: 0.5,
                my: 0.5,
                fontSize: '0.9rem',
                padding: "10px 16px",
                position: "relative",
                zIndex: 1,
                transition: "all 0.2s ease",
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(0, 123, 255, 0.15)'
                    : 'rgba(0, 123, 255, 0.1)',
                  borderRadius: "8px",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 1.5
                }}
              >
                <VisibilityIcon
                  sx={{
                    color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                    fontSize: "1.1rem"
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: "0.9rem",
                }}
              >
                Visibility
              </Typography>
            </MenuItem>
          )}
        </Menu>

        {/* Group Visibility Settings Dialog */}
        {settingsOpen && groupInfo?.id && (
          <GroupVisibilitySettings
            groupId={groupInfo.id}
            currentVisibility={groupInfo?.visibility}
            open={settingsOpen}
            onClose={handleSettingsClose}
          />
        )}
      </Box>
    </Slide>
  );
});

export default Topbar;
