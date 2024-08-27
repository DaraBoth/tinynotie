import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useGetAllUsersMutation, useUpdateGroupVisibilityMutation } from "../api/api";

export default function GroupVisibilitySettings({ groupId, currentVisibility }) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState(currentVisibility || "public");
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [triggerGetUsers, resultGetUsers] = useGetAllUsersMutation();
  const [triggerUpdateVisibility, resultUpdateVisibility] = useUpdateGroupVisibilityMutation();
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      triggerGetUsers().then((response) => {
        if (response.data?.status) {
          setUsersList(response.data.data);
        }
      });
    }
  }, [open, triggerGetUsers]);

  const handleVisibilityChange = (event) => {
    setVisibility(event.target.value);
  };

  const handleAllowedUsersChange = (event) => {
    setAllowedUsers(event.target.value);
  };

  const handleSave = async () => {
    setLoading(true);
    const response = await triggerUpdateVisibility({
      group_id: groupId,
      visibility,
      allowed_users: visibility === "private" ? allowedUsers.map(user => user.id) : [],
    }).unwrap();

    setSnackbarMessage(response.message || "Error updating group visibility.");
    setSnackbarSuccess(response.status);
    setLoading(false);
    setOpen(false);
  };

  return (
    <Box>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Visibility Settings
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Update Group Visibility</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Visibility</InputLabel>
            <Select
              value={visibility}
              onChange={handleVisibilityChange}
              input={<OutlinedInput label="Visibility" />}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>

          {visibility === "private" && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Allowed Users</InputLabel>
              <Select
                multiple
                value={allowedUsers}
                onChange={handleAllowedUsersChange}
                input={<OutlinedInput label="Allowed Users" />}
                renderValue={(selected) => selected.map(user => user.usernm).join(", ")}
              >
                {usersList.map((user) => (
                  <MenuItem key={user.id} value={user}>
                    <Checkbox checked={allowedUsers.indexOf(user) > -1} />
                    <ListItemText primary={user.usernm} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">Cancel</Button>
          <Button onClick={handleSave} color="primary" disabled={loading}>
            {loading ? <CircularProgress size="1rem" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage('')}
      >
        <Alert severity={snackbarSuccess ? "success" : "error"}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
