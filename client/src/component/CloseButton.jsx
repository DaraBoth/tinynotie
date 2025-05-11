import React from 'react';
import { Fab, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { tokens } from '../theme';
import { motion } from 'framer-motion';

/**
 * A styled close button that matches the application's design language
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Function to call when button is clicked
 * @param {string} props.position - CSS position value (default: 'fixed')
 * @param {string} props.bottom - CSS bottom value (default: '24px')
 * @param {string} props.right - CSS right value (default: '24px')
 * @param {number} props.zIndex - CSS z-index value (default: 1000)
 * @param {string} props.size - Button size ('small', 'medium', 'large') (default: 'medium')
 */
const CloseButton = ({
  onClick,
  position = 'fixed',
  bottom = '24px',
  right = '24px',
  zIndex = 1000,
  size = 'medium'
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Determine size values based on the size prop
  const getSizeValues = () => {
    switch(size) {
      case 'small':
        return { width: '40px', height: '40px', iconSize: 'small' };
      case 'large':
        return { width: '56px', height: '56px', iconSize: 'medium' };
      case 'medium':
      default:
        return { width: '48px', height: '48px', iconSize: 'medium' };
    }
  };

  const { width, height, iconSize } = getSizeValues();

  return (
    <Fab
      aria-label="close"
      component={motion.button}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      sx={{
        position,
        bottom,
        right,
        zIndex,
        width,
        height,
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(156, 39, 176, 0.8)' // Purple with transparency in dark mode
          : 'rgba(156, 39, 176, 0.9)', // Purple with transparency in light mode
        color: '#fff',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(156, 39, 176, 0.9)'
            : 'rgba(156, 39, 176, 1)',
          transform: "scale(1.1) translateZ(5px)",
          boxShadow: theme.palette.mode === 'dark'
            ? '0 5px 15px rgba(156, 39, 176, 0.5)'
            : '0 5px 15px rgba(156, 39, 176, 0.3)',
        },
        transition: "transform 0.3s, box-shadow 0.3s, background-color 0.3s",
        boxShadow: theme.palette.mode === 'dark'
          ? '0 3px 10px rgba(0, 0, 0, 0.4)'
          : '0 3px 10px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(4px)',
        border: `1px solid ${theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(255, 255, 255, 0.5)'}`,
        borderRadius: '50%', // Ensure it's always perfectly round
        aspectRatio: '1/1', // Maintain aspect ratio
      }}
    >
      <CloseIcon fontSize={iconSize} />
    </Fab>
  );
};

export default CloseButton;
