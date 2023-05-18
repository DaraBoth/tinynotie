import { Alert, Snackbar } from '@mui/material'
import React, { useState } from 'react'

export default function alert() {

    const [open, setOpen] = useState(false);
    const [success, setSuccess] = useState(false);
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };


    return (
        <>
            <Snackbar
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                open={open}
                autoHideDuration={3000}
                onClose={handleClose}>
                <Alert onClose={handleClose} severity={success ? "success" : "error"} sx={{ width: '100%' }}>
                    {message}
                </Alert>
            </Snackbar>
        </>
    )
}
