import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { tokens } from '../theme';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';
import meowing from '../assets/meowing.json';
import SpaceSkyNew from './SpaceSkyNew';

export default function LoadingPage() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      opacity: [0.95, 1, 0.95],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Dots animation for loading indicator
  const LoadingDots = () => (
    <Box sx={{ display: 'flex', gap: '6px', mt: 1, justifyContent: 'center' }}>
      {[0, 1, 2].map((dot) => (
        <motion.div
          key={dot}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: dot * 0.3,
            ease: "easeInOut"
          }}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: theme.palette.mode === 'dark' ? colors.blueAccent[200] : colors.primary[500],
          }}
        />
      ))}
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: colors.primary[800], // Match login page background
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Add the 3D Space Sky background */}
      <SpaceSkyNew />

      {/* Content Container with Framer Motion */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{
          width: '100%',
          maxWidth: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Content container that blends with background */}
        <motion.div
          variants={pulseVariants}
          animate="pulse"
          style={{
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: 'transparent',
          }}
        >
          {/* Title with animation */}
          <motion.div variants={itemVariants}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: colors.blueAccent[300],
                fontWeight: 500,
                fontSize: { xs: '1.4rem', sm: '1.6rem' },
                fontFamily: 'Bricolage Grotesque, Montserrat, Poppins, sans-serif',
                letterSpacing: '0.5px',
              }}
            >
              TinyNotie
            </Typography>
          </motion.div>

          {/* Lottie Animation with motion */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '120px',
              height: '120px',
              overflow: 'hidden',
              backgroundColor: 'transparent',
            }}
          >
            <Lottie
              animationData={meowing}
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>

          {/* Loading Text with animation */}
          <motion.div variants={itemVariants} style={{ marginTop: '8px' }}>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.blueAccent[200] : colors.primary[500],
                fontFamily: 'Bricolage Grotesque, Montserrat, Poppins, sans-serif',
                fontWeight: 500,
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                letterSpacing: '0.5px',
                lineHeight: 1.5,
              }}
            >
              Meowing, please wait
            </Typography>
            <LoadingDots />
          </motion.div>
        </motion.div>
      </motion.div>
    </Box>
  );
}
