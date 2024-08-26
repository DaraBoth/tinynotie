import React from 'react';
import { CircularProgress, Box, Typography, useTheme } from '@mui/material';
import { tokens } from '../theme';

export default function LoadingPage() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: colors.primary[900], // Ensure a dark background for dark mode
      }}
    >
      <CircularProgress color="primary" />
      <Typography
        variant="h6"
        sx={{
          marginLeft: 2,
          color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.primary[100],
        }}
      >
        Loading...
      </Typography>
    </Box>
  );
}