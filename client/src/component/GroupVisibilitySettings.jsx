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
  Typography,  // Add Typography for loading text
} from "@mui/material";
import { useGetAllUsersMutation, useUpdateGroupVisibilityMutation, useGetGroupVisibilityMutation } from "../api/api";

export default function GroupVisibilitySettings({ groupId, open, onClose }) {
  const [visibility, setVisibility] = useState("public");
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [triggerGetUsers] = useGetAllUsersMutation();
  const [triggerUpdateVisibility] = useUpdateGroupVisibilityMutation();
  const [triggerGetVisibility] = useGetGroupVisibilityMutation();
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [fetchingData, setFetchingData] = useState(true); // New state to track fetching status

  useEffect(() => {
    if (open) {
      setFetchingData(true);
      // Fetch current visibility settings
      triggerGetVisibility({ group_id: groupId }).then((response) => {
        if (response.data?.status) {
          setVisibility(response.data.data.visibility);
          
          // Fetch all users
          triggerGetUsers().then((userResponse) => {
            if (userResponse.data?.status) {
              setUsersList(userResponse.data.data);

              // Match allowed users with the full user objects
              const allowedUserObjects = userResponse.data.data.filter(user =>
                response.data.data.allowed_users.some(allowed => allowed.id === user.id)
              );
              setAllowedUsers(allowedUserObjects);
              setFetchingData(false); // Data fetched, stop loading
            }
          });
        }
      });
    }
  }, [open, groupId, triggerGetUsers, triggerGetVisibility]);

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
    onClose();
  };

  return (
    <Box>
      <Dialog open={open} onClose={onClose}>
        {fetchingData ? (
          <Box display="flex" justifyContent="center" alignItems="center" padding="20px">
            <CircularProgress />
            <Typography marginLeft="10px">Loading...</Typography> {/* Loading indicator and message */}
          </Box>
        ) : (
          <>
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
              <Button onClick={onClose} color="primary">Cancel</Button>
              <Button onClick={handleSave} color="primary" disabled={loading}>
                {loading ? <CircularProgress size="1rem" /> : "Save"}
              </Button>
            </DialogActions>
          </>
        )}
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
