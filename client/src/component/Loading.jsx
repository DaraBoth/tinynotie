import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { tokens } from '../theme';
import Lottie from 'lottie-react';
import dogWalk from '../assets/animation.json';
import cooking from '../assets/cooking.json';
import meowing from '../assets/meowing.json';

export default function LoadingPage() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: colors.primary[900],
        textAlign: 'center',
      }}
    >
      {/* Lottie Animation */}
      <Lottie
        animationData={meowing}
        loop={true}
        style={{ width: 150, height: 150 }} // Adjust size as needed
      />
      {/* Loading Text */}
      <Typography
        variant="h5"
        sx={{
          marginTop: 2,
          color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.primary[100],
          animation: 'fade-in 2s ease-in-out infinite alternate', // Simple fade animation
          '@keyframes fade-in': {
            '0%': { opacity: 0.6 },
            '100%': { opacity: 1 },
          },
        }}
      >
        Meowing, please wait...
      </Typography>
    </Box>
  );
}
