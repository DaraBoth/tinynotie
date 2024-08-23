import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, useTheme } from '@mui/material';
import { tokens } from '../theme';

const CustomDialog = ({ open, onClose, title, children }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.background, // Dialog background color
          color: colors.primary[500], // Text color for title and content
        },
      }}
    >
      <DialogTitle
        sx={{
          color: colors.primary[500], // Title text color
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent
        sx={{
          color: colors.primary[600], // Content text color
        }}
      >
        {children}
      </DialogContent>
      <DialogActions>
        <Button
          color="secondary"
          onClick={onClose}
          sx={{
            color: colors.primary[500], // Button text color
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomDialog;
