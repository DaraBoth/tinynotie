import React, { memo } from "react";
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  Tooltip,
  Slide,
} from "@mui/material";
import { motion } from "framer-motion";
import LogoutIcon from "@mui/icons-material/Logout";
import { tokens } from "../theme";

const HomeTopbar = memo(({ 
  title = "TinyNotie", 
  onLogout, 
  onProfileClick, 
  profileImage,
  scrollDirection 
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Slide appear={false} direction="down" in={scrollDirection !== "down"}>
      <Box
        component={motion.div}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backdropFilter: 'blur(10px)',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(20, 23, 39, 0.75)'
            : 'rgba(255, 255, 255, 0.75)',
          borderBottom: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.05)'}`,
          marginBottom: "16px",
          transition: 'all 0.3s ease',
        }}
      >
        {/* Left section with app title */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.1rem", md: "1.3rem" },
              color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
              fontFamily: 'Bricolage Grotesque, Montserrat, Poppins, sans-serif',
              textShadow: theme.palette.mode === 'dark'
                ? '0px 1px 2px rgba(0, 0, 0, 0.3)'
                : 'none',
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Right section with profile and logout */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Tooltip title="Profile settings">
            <IconButton
              onClick={onProfileClick}
              aria-label="profile"
              sx={{
                padding: '8px',
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${colors.primary[500]}`,
                }}
              />
            </IconButton>
          </Tooltip>

          <Tooltip title="Logout">
            <IconButton
              onClick={onLogout}
              aria-label="logout"
              sx={{
                padding: '8px',
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 0, 0, 0.1)'
                    : 'rgba(255, 0, 0, 0.05)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <LogoutIcon
                sx={{
                  color: colors.redAccent[500],
                  fontSize: { xs: "1.2rem", md: "1.4rem" }
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Slide>
  );
});

export default HomeTopbar;
