import React from 'react';
import { Box, useTheme } from '@mui/material';
import { tokens } from '../theme';
import Lottie from 'lottie-react';
import notfound from '../assets/notfound.json';

export default function NotFoundPage() {
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
        animationData={notfound}
        loop={true}
        style={{ width: 150, height: 150 }} // Adjust size as needed
      />
    </Box>
  );
}
