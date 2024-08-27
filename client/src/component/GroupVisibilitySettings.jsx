import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  InputAdornment,
  DialogContentText,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  useUpdateGroupVisibilityMutation,
  useGetGroupVisibilityMutation,
  useUserSearchMutation,
} from "../api/api";
import { tokens } from "../theme";

export default function GroupVisibilitySettings({ groupId, open, onClose }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [visibility, setVisibility] = useState("public");
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerUserSearch] = useUserSearchMutation();
  const [triggerUpdateVisibility] = useUpdateGroupVisibilityMutation();
  const [triggerGetVisibility] = useGetGroupVisibilityMutation();
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      triggerGetVisibility({ group_id: groupId }).then((response) => {
        if (response.data?.status) {
          setVisibility(response.data.data.visibility);
          setAllowedUsers(response.data.data.allowed_users || []);
          setLoading(false);
        }
      });
    }
  }, [open, groupId, triggerGetVisibility]);

  const handleVisibilityToggle = (event) => {
    setVisibility(event.target.checked ? "public" : "private");
    setHasUnsavedChanges(true);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = async () => {
    const response = await triggerUserSearch({
      searchWords: searchQuery,
      filterBy: "ALL",
    });
    if (response.data?.status) {
      const filteredResults = response.data.data.filter(
        (user) => !allowedUsers.some((u) => u.id === user.id)
      );
      setAvailableUsers(filteredResults);
    }
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    let updatedAvailableUsers = [...availableUsers];
    let updatedAllowedUsers = [...allowedUsers];

    if (
      source.droppableId === "availableUsers" &&
      destination.droppableId === "allowedUsers"
    ) {
      const [movedUser] = updatedAvailableUsers.splice(source.index, 1);
      updatedAllowedUsers.splice(destination.index, 0, movedUser);
    } else if (
      source.droppableId === "allowedUsers" &&
      destination.droppableId === "availableUsers"
    ) {
      const [movedUser] = updatedAllowedUsers.splice(source.index, 1);
      updatedAvailableUsers.splice(destination.index, 0, movedUser);
    }

    setAvailableUsers(updatedAvailableUsers);
    setAllowedUsers(updatedAllowedUsers);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    const response = await triggerUpdateVisibility({
      group_id: groupId,
      visibility,
      allowed_users:
        visibility === "private" ? allowedUsers.map((user) => user.id) : [],
    }).unwrap();

    setSnackbarMessage(response.message || "Error updating group visibility.");
    setSnackbarSuccess(response.status);
    setLoading(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmationDialog(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowConfirmationDialog(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  return (
    <Box sx={{ position: "relative", zIndex: 0 }}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        {loading && (
          <Box
            sx={{
              position: "absolute", // Change to fixed for full-screen overlay
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.palette.mode === "dark" ? colors.primary[900] : colors.primary[100] ,
              zIndex: 1300, // Ensure it's above the dialog
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: { xs: "center", md: "space-between" },
              alignItems: { xs: "flex-start", md: "flex-start" },
            }}
          >
            <Typography>Update Group Visibility</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={visibility === "public"}
                  onChange={handleVisibilityToggle}
                />
              }
              label={visibility === "private" ? "Private" : "Public"}
              sx={{ mt: { xs: 2, md: 0 } }}
            />
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: "16px",
              marginTop: "16px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <DragDropContext onDragEnd={handleDragEnd}>
              <Box
                sx={{
                  flex: 1,
                  maxHeight: { xs: "300px", md: "400px" },
                  overflowY: "auto",
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Search User"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSearch}>
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ marginY: "8px" }}
                />
                <Droppable droppableId="availableUsers">
                  {(provided) => (
                    <List
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{
                        minHeight: 200,
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: 1,
                      }}
                    >
                      {availableUsers.map((user, index) => (
                        <Draggable
                          key={user.id}
                          draggableId={user.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <ListItemText primary={user.usernm} />
                            </ListItem>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </List>
                  )}
                </Droppable>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  maxHeight: { xs: "300px", md: "400px" },
                  overflowY: "auto",
                  backgroundColor:
                    visibility === "public"
                      ? "rgba(0, 0, 0, 0.1)"
                      : "transparent",
                  position: "relative",
                }}
              >
                <Typography variant="subtitle1">Selected Users</Typography>
                <Droppable droppableId="allowedUsers">
                  {(provided) => (
                    <List
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{
                        minHeight: 200,
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: 1,
                      }}
                    >
                      {allowedUsers.map((user, index) => (
                        <Draggable
                          key={user.id}
                          draggableId={user.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <ListItemText primary={user.usernm} />
                            </ListItem>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </List>
                  )}
                </Droppable>
                {visibility === "public" && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      padding: { xs: 2, md: 4 },
                      textAlign: "center",
                      borderRadius: "4px",
                    }}
                  >
                    <Typography
                      variant="h6"
                      color="textSecondary"
                      sx={{
                        marginBottom: { xs: 1, md: 2 },
                        fontSize: { xs: "1rem", md: "1.25rem" },
                      }}
                    >
                      This list does not matter anymore when the group is set to
                      public.
                    </Typography>
                  </Box>
                )}
              </Box>
            </DragDropContext>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            disabled={loading || !hasUnsavedChanges}
          >
            {loading ? <CircularProgress size="1rem" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarSuccess ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog open={showConfirmationDialog}>
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Are you sure you want to close without
            saving?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmationDialog(false)}
            color="primary"
          >
            No
          </Button>
          <Button onClick={confirmClose} color="primary" autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
