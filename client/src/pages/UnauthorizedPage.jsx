import React from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { tokens } from '../theme';

export default function UnauthorizedPage() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: colors.primary[900],
      }}
    >
      <Typography variant="h4" sx={{ color: colors.primary[100], marginBottom: 2 }}>
        Unauthorized Access
      </Typography>
      <Typography variant="body1" sx={{ color: colors.primary[300], marginBottom: 4 }}>
        You do not have permission to view this page. Please log in.
      </Typography>
      <Button variant="contained" color="primary" onClick={handleLoginRedirect}>
        Go to Login Page
      </Button>
    </Box>
  );
}