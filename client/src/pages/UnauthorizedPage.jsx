import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8d7da',
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, color: '#721c24' }}>
        Unauthorized
      </Typography>
      <Typography variant="h6" sx={{ mb: 4, color: '#721c24' }}>
        You are not authorized to view this page.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/login')}
      >
        Go to Login
      </Button>
    </Box>
  );
};

export default UnauthorizedPage;
