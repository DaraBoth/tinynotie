import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';

const TokenExpirationHandler = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  // Select the token expiration state from the store
  const tokenExpired = useSelector(state => state.auth?.tokenExpired);

  useEffect(() => {
    // If token has expired, show the snackbar
    if (tokenExpired) {
      setOpen(true);

      // Redirect to login page after a short delay
      const timer = setTimeout(() => {
        // Instead of using navigate, we'll set the user state to false
        // and remove the token from sessionStorage
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("secret");

        // Force a page reload to redirect to login
        window.location.href = "/login";

        // Reset the token expired state
        dispatch({ type: 'auth/resetTokenExpired' });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [tokenExpired, dispatch]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={handleClose}
        severity="error"
        variant="filled"
        sx={{ width: '100%' }}
      >
        Your session has expired. Please log in again.
      </Alert>
    </Snackbar>
  );
};

export default TokenExpirationHandler;
