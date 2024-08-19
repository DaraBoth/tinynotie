import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const CustomAlert = ({
  open,
  onClose,
  message = 'Something went wrong!',
  type = 'error',  // 'success', 'error', 'warning', 'info'
  duration = 3000, // 3 seconds by default
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={type} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomAlert;
