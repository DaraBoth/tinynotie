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
  alpha,
  useMediaQuery,
} from "@mui/material";
import useWindowDimensions from "../hooks/useWindowDimensions";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningIcon from "@mui/icons-material/Warning";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  useUpdateGroupVisibilityMutation,
  useGetGroupVisibilityMutation,
  useUserSearchMutation,
} from "../api/api";
import { tokens } from "../theme";
import { motion } from "framer-motion";

export default function GroupVisibilitySettings({ groupId, open, onClose }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { width: windowWidth } = useWindowDimensions();
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
    let isMounted = true;

    const fetchVisibility = async () => {
      if (!open || !groupId) return;

      try {
        setLoading(true);
        const response = await triggerGetVisibility({ group_id: groupId });

        if (isMounted) {
          if (response.data?.status) {
            setVisibility(response.data.data.visibility || "private");
            setAllowedUsers(response.data.data.allowed_users || []);
          } else {
            // Handle error response
            setSnackbarMessage(response.data?.message || "Failed to load group visibility settings");
            setSnackbarSuccess(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching visibility:", error);
          setSnackbarMessage("Error loading settings. Please try again.");
          setSnackbarSuccess(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVisibility();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [open, groupId, triggerGetVisibility]);

  const handleVisibilityToggle = (event) => {
    setVisibility(event.target.checked ? "public" : "private");
    setHasUnsavedChanges(true);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setAvailableUsers([]);
      return;
    }

    try {
      setIsSearching(true); // Start loading
      const response = await triggerUserSearch({
        searchWords: searchQuery,
        filterBy: "ALL",
      });

      if (response.data?.status) {
        // Filter out users that are already in the allowed list
        const filteredResults = response.data.data.filter(
          (user) => !allowedUsers.some((u) => u.id === user.id)
        );
        setAvailableUsers(filteredResults);
      } else {
        setSnackbarMessage(response.data?.message || "Search failed");
        setSnackbarSuccess(false);
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSnackbarMessage("Error searching users. Please try again.");
      setSnackbarSuccess(false);
      setAvailableUsers([]);
    } finally {
      setIsSearching(false); // Stop loading
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
    try {
      setLoading(true);

      // Prepare the allowed users list only if visibility is private
      const allowedUserIds = visibility === "private"
        ? allowedUsers.map((user) => user.id)
        : [];

      const response = await triggerUpdateVisibility({
        group_id: groupId,
        visibility,
        allowed_users: allowedUserIds,
      }).unwrap();

      setSnackbarMessage(response.message || "Group visibility updated successfully.");
      setSnackbarSuccess(response.status);
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error("Error updating visibility:", error);
      setSnackbarMessage(error.data?.message || "Error updating group visibility. Please try again.");
      setSnackbarSuccess(false);
    } finally {
      setLoading(false);
    }
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

  // Memoize styles to prevent recalculations during renders
  const itemStyle = React.useMemo(() => ({
    userSelect: "none",
    background: colors.primary[500],
    cursor: "pointer",
    color: colors.primary[900],
  }), [colors]);

  const draggingItemStyle = React.useMemo(() => ({
    ...itemStyle,
    background: colors.primary[400],
    cursor: "all-scroll",
  }), [colors, itemStyle]);

  const listStyle = React.useMemo(() => ({
    background: colors.background,
    color: colors.primary[900],
    minHeight: 200,
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: 8,
  }), [colors]);

  const draggingOverListStyle = React.useMemo(() => ({
    ...listStyle,
    background: colors.primary[200],
    cursor: "all-scroll",
  }), [colors, listStyle]);

  // Simplified style getters that use memoized objects
  const getItemStyle = (isDragging, draggableStyle) => ({
    ...(isDragging ? draggingItemStyle : itemStyle),
    ...draggableStyle,
  });

  const getListStyle = (isDraggingOver) =>
    isDraggingOver ? draggingOverListStyle : listStyle;

  return (
    <Box sx={{ position: "relative", zIndex: 0 }}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 1600, // Higher z-index to ensure it appears above floating buttons
          '& .MuiDialog-container': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, y: 20, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 20, scale: 0.95 },
          transition: { duration: 0.3 },
          sx: {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: { xs: "16px", md: "20px" },
            color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 25px rgba(0, 0, 0, 0.5)'
              : '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: "hidden",
            width: isMobile ? `${windowWidth - 64}px` : "auto", // Calculate exact width with larger margins
            maxWidth: isMobile ? `${windowWidth - 64}px` : "md",
            minWidth: isMobile ? "auto" : "450px", // Override default minWidth for mobile
            margin: isMobile ? '32px' : 'auto',
          },
        }}
      >
        {/* Loading overlay with reduced opacity and simplified rendering */}
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.palette.mode === "dark"
                ? "rgba(20, 23, 39, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              zIndex: 1300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
              borderRadius: "16px",
            }}
          >
            <CircularProgress
              size={40}
              thickness={4}
              sx={{
                color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600]
              }}
            />
          </Box>
        )}

        {/* Subtle gradient overlay for depth */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <DialogTitle
          sx={{
            padding: { xs: "0 0 12px 0", md: "0 0 20px 0" },
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            borderBottom: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            marginBottom: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(0, 123, 255, 0.15)'
                  : 'rgba(0, 123, 255, 0.1)',
                borderRadius: "12px",
                padding: isMobile ? "8px" : "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: isMobile ? 1 : 1.5
              }}
            >
              <VisibilityIcon
                sx={{
                  color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                  fontSize: { xs: "1rem", md: "1.3rem" }
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                fontSize: { xs: "0.9rem", md: "1.2rem" },
                fontWeight: 600,
                letterSpacing: "-0.01em"
              }}
            >
              {isMobile ? "Visibility" : "Group Visibility Settings"}
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={visibility === "public"}
                onChange={handleVisibilityToggle}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: isMobile ? "0.8rem" : "0.875rem",
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                }}
              >
                {visibility === "private" ? "Private" : "Public"}
              </Typography>
            }
            sx={{
              mt: isMobile ? 1 : { xs: 2, md: 0 },
              ml: isMobile ? 0 : undefined,
              alignSelf: isMobile ? "flex-end" : undefined
            }}
          />
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
                  onKeyDown={(event) => {
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

                                    color: theme.palette.text.primary, // Use theme text color
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
                                  color: theme.palette.text.primary, // Use theme text color
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

        <DialogActions
          sx={{
            padding: { xs: "16px 0 0 0", md: "20px 0 0 0" },
            position: "relative",
            zIndex: 1,
            borderTop: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            marginTop: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2
          }}
        >
          <Button
            onClick={handleClose}
            variant="outlined"
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
              textTransform: "none",
              fontWeight: "500",
              fontSize: { xs: "0.8rem", md: "0.9rem" },
              padding: { xs: "6px 16px", md: "8px 20px" },
              borderRadius: "8px",
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            variant="contained"
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || !hasUnsavedChanges}
            startIcon={loading && <CircularProgress size="1rem" color="inherit" />}
            sx={{
              backgroundColor: colors.primary[theme.palette.mode === 'dark' ? 500 : 600],
              color: "#fff",
              "&:hover": {
                backgroundColor: colors.primary[theme.palette.mode === 'dark' ? 600 : 700],
              },
              textTransform: "none",
              fontWeight: "500",
              fontSize: { xs: "0.8rem", md: "0.9rem" },
              padding: { xs: "6px 16px", md: "8px 20px" },
              borderRadius: "8px",
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 10px rgba(0, 123, 255, 0.2)'
                : '0 4px 10px rgba(0, 123, 255, 0.15)',
            }}
          >
            {loading ? "Saving..." : "Save Changes"}
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

      <Dialog
        open={showConfirmationDialog}
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, y: 20, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 20, scale: 0.95 },
          transition: { duration: 0.3 },
          sx: {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: { xs: "16px", md: "20px" },
            color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 25px rgba(0, 0, 0, 0.5)'
              : '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: "hidden",
          },
        }}
      >
        {/* Subtle gradient overlay for depth */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40px",
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <DialogTitle
          sx={{
            padding: { xs: "0 0 16px 0", md: "0 0 20px 0" },
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            borderBottom: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            marginBottom: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 59, 59, 0.15)'
                : 'rgba(255, 59, 59, 0.1)',
              borderRadius: "12px",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 1.5
            }}
          >
            <WarningIcon
              sx={{
                color: colors.redAccent[theme.palette.mode === 'dark' ? 400 : 600],
                fontSize: { xs: "1.2rem", md: "1.3rem" }
              }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
              fontSize: { xs: "1.1rem", md: "1.2rem" },
              fontWeight: 600,
              letterSpacing: "-0.01em"
            }}
          >
            Unsaved Changes
          </Typography>
        </DialogTitle>

        <DialogContent
          sx={{
            padding: { xs: "16px 0", md: "20px 0" },
            position: "relative",
            zIndex: 1,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
              fontSize: { xs: "0.9rem", md: "1rem" },
              lineHeight: 1.5,
            }}
          >
            You have unsaved changes. Are you sure you want to close without saving?
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            padding: { xs: "16px 0 0 0", md: "20px 0 0 0" },
            position: "relative",
            zIndex: 1,
            borderTop: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            marginTop: 2,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2
          }}
        >
          <Button
            onClick={() => setShowConfirmationDialog(false)}
            variant="outlined"
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
              textTransform: "none",
              fontWeight: "500",
              fontSize: { xs: "0.8rem", md: "0.9rem" },
              padding: { xs: "6px 16px", md: "8px 20px" },
              borderRadius: "8px",
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            No, Keep Editing
          </Button>

          <Button
            onClick={confirmClose}
            variant="contained"
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            autoFocus
            sx={{
              backgroundColor: colors.redAccent[theme.palette.mode === 'dark' ? 500 : 600],
              color: "#fff",
              "&:hover": {
                backgroundColor: colors.redAccent[theme.palette.mode === 'dark' ? 600 : 700],
              },
              textTransform: "none",
              fontWeight: "500",
              fontSize: { xs: "0.8rem", md: "0.9rem" },
              padding: { xs: "6px 16px", md: "8px 20px" },
              borderRadius: "8px",
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 10px rgba(255, 59, 59, 0.2)'
                : '0 4px 10px rgba(255, 59, 59, 0.15)',
            }}
          >
            Yes, Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
