import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

const LoadingPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f0f0',
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Loading, please wait...
      </Typography>
    </Box>
  );
};

export default LoadingPage;
