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
  Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
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
  const [isSearching, setIsSearching] = useState(false); // Add loading state for search

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
    setIsSearching(true); // Start loading
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
    setIsSearching(false); // Stop loading
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

  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: "none",
    background: isDragging ? colors.primary[500] : colors.primary[500],
    cursor: isDragging ? "all-scroll" : "pointer",
    ...draggableStyle,
  });

  const getListStyle = (isDraggingOver) => ({
    background: isDraggingOver ? colors.primary[200] : colors.background,
    color: isDraggingOver ? colors.primary[900] : colors.primary[900],
    cursor: "all-scroll",
  });

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
              backgroundColor:
                theme.palette.mode === "dark"
                  ? colors.primary[900]
                  : colors.primary[100],
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
                  sx={{
                    marginY: "8px",
                    "& input:-webkit-autofill": {
                      WebkitBoxShadow: `0 0 0 1000px ${colors.grey[800]} inset !important`,
                      WebkitTextFillColor: `${colors.primary[100]} !important`,
                    },
                  }}
                />
                <Droppable droppableId="availableUsers">
                  {(provided, snapshot) => (
                    <List
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{
                        minHeight: 200,
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: 1,
                        backgroundColor: "#f7f7f7",
                      }}
                      style={getListStyle(snapshot.isDraggingOver)}
                    >
                      {isSearching ? (
                        Array.from(new Array(3)).map((_, index) => (
                          <ListItem key={index}>
                            <Skeleton
                              variant="rectangular"
                              width="100px"
                              height={40}
                            />
                          </ListItem>
                        ))
                      ) : availableUsers.length === 0 ? ( // Check if no users are found
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ padding: 2, textAlign: "center" }}
                        >
                          No users found.
                        </Typography>
                      ) : (
                        availableUsers.map((user, index) => (
                          <Draggable
                            key={user.id}
                            draggableId={user.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <ListItem
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={getItemStyle(
                                  snapshot.isDragging,
                                  provided.draggableProps.style
                                )}
                                sx={{
                                  border: "1px solid #ddd",
                                  borderRadius: "8px",
                                  marginBottom: "8px",
                                  padding: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  backgroundColor: "white",
                                  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                                  cursor: "grab !important",
                                  transition: "background-color 0.3s",
                                  ":hover": {
                                    backgroundColor: "#f5f5f5",
                                  },
                                  width: "auto",
                                  maxWidth: "100%",
                                  marginRight: "5px",
                                  gap: "4px", // Closer spacing between items
                                }}
                              >
                                <IconButton
                                  {...provided.dragHandleProps}
                                  sx={{
                                    borderRadius: "50%",
                                    marginRight: 0, // Remove extra spacing
                                    padding: "0px", // Reduce padding for closer appearance
                                    ":hover": {
                                      backgroundColor: "transparent", // No hover effect
                                    },
                                  }}
                                >
                                  <DragIndicatorIcon />
                                </IconButton>
                                <ListItemText
                                  primary={user.usernm}
                                  sx={{
                                    fontWeight: "bold",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    marginLeft: "0px", // Ensure text is close to the icon
                                  }}
                                />
                              </ListItem>
                            )}
                          </Draggable>
                        ))
                      )}
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
                  {(provided, snapshot) => (
                    <List
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{
                        minHeight: 200,
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: 1,
                        backgroundColor: "#f7f7f7", // Consistent background color
                      }}
                      style={getListStyle(snapshot.isDraggingOver)}
                    >
                      {allowedUsers.map((user, index) => (
                        <Draggable
                          key={user.id}
                          draggableId={user.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                marginBottom: "8px",
                                padding: "8px",
                                display: "inline-flex",
                                alignItems: "center",
                                backgroundColor: "white",
                                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                                cursor: "grab !important",
                                transition: "background-color 0.3s",
                                ":hover": {
                                  backgroundColor: "#f5f5f5",
                                },
                                width: "auto",
                                maxWidth: "100%",
                                gap: "4px", // Closer spacing between items
                              }}
                              style={getItemStyle(
                                snapshot.isDragging,
                                provided.draggableProps.style
                              )}
                            >
                              <IconButton
                                {...provided.dragHandleProps}
                                sx={{
                                  borderRadius: "50%",
                                  marginRight: 0, // Remove extra spacing
                                  padding: "0px", // Reduce padding for closer appearance
                                  ":hover": {
                                    backgroundColor: "transparent", // No hover effect
                                  },
                                }}
                              >
                                <DragIndicatorIcon />
                              </IconButton>
                              <ListItemText
                                primary={user.usernm}
                                sx={{
                                  fontWeight: "bold",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  marginLeft: "0px", // Ensure text is close to the icon
                                }}
                              />
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
