import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useUpdateUserInfoMutation } from "../api/api";

const ProfileSettings = ({ open, onClose, user }) => {
  const [formData, setFormData] = useState({
    phone_number: "",
    email: "",
    first_name: "",
    last_name: "",
    usernm: "",
    passwd: "",
    profile_url: "",
    device_id: "",
    telegram_chat_id: "",
  });
  const [updateUserInfo, { isLoading }] = useUpdateUserInfoMutation();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await updateUserInfo(formData).unwrap();
      setSnackbarMessage(response.message);
      setSnackbarSuccess(response.status);
      setOpenSnackbar(true);
      if (response.status) {
        onClose();
      }
    } catch (error) {
      setSnackbarMessage(error.data.message);
      setSnackbarSuccess(false);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Profile Settings</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="phone_number"
            label="Phone Number"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.phone_number}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="first_name"
            label="First Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.first_name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="last_name"
            label="Last Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.last_name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="usernm"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.usernm}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="passwd"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.passwd}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="profile_url"
            label="Profile URL"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.profile_url}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="device_id"
            label="Device ID"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.device_id}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="telegram_chat_id"
            label="Telegram Chat ID"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.telegram_chat_id}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size="1rem" />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSuccess ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProfileSettings;
