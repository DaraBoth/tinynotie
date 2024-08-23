import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Paper,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Skeleton,
} from "@mui/material";
import { useDeleteGroupMutation, useGetGroupMutation } from "../api/api";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import { rspWidth } from "../responsive";
import { tokens } from "../theme";

function GroupCard({ item, onDelete, onClick }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Paper
      elevation={3}
      sx={{
        cursor: "pointer",
        padding: "15px",
        borderRadius: "12px",
        border: `1px solid ${colors.primary[700]}`, // Updated to use primary dark pink color
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
        },
        position: "relative",
        backgroundColor: colors.grey[800], // Darker background for group cards
      }}
      onClick={() => onClick(item)}
    >
      <Typography variant="h6" fontWeight="bold" color={colors.primary[100]}>
        Title: {item.grp_name}
      </Typography>
      <Typography variant="body2" color={colors.grey[300]}>
        Currency: <span style={{ color: colors.primary[300] }}>{item.currency}</span>
      </Typography>
      <Typography variant="body2" color={colors.grey[300]}>
        Create Date: <span style={{ color: colors.primary[300] }}>{item.create_date}</span>
      </Typography>
      <IconButton
        aria-label="delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(item.id);
        }}
        sx={{
          position: "absolute",
          top: 5,
          right: 5,
          color: colors.redAccent[500],
        }}
      >
        <DeleteIcon />
      </IconButton>
    </Paper>
  );
}

export default function Home({ user, setUser, secret, setGroupInfo }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [triggerUser, resultUser] = useGetGroupMutation();
  const [triggerDeleteGroup, resultGroup] = useDeleteGroupMutation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const navigate = useNavigate();
  const isNonMobile = useMediaQuery("(min-width:600px)");

  const widthItem = rspWidth("calc(100%/2)", "100%", "260px");
  const gridColItem = rspWidth("repeat(4,1fr)", "repeat(1,1fr)", "auto");
  const fontSize = rspWidth("normal", "18px", "16px");

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    triggerUser({ user, user_id: secret });
  }, [triggerUser, user, secret]);

  useEffect(() => {
    if (resultUser.data?.status) {
      setData(resultUser.data.data);
      setLoading(false);
    }
  }, [resultUser.data]);

  const handleLogout = () => {
    setUser(false);
    navigate("/login");
  };

  const handleCreateGroup = () => {
    navigate("/creategroup");
  };

  const handleGroupClick = (item) => {
    setGroupInfo({
      group_id: item.id,
      grp_name: item.grp_name,
      currency: item.currency,
    });
    navigate("/group");
  };

  const handleDeleteNote = async (noteId) => {
    const response = await triggerDeleteGroup({ group_id: noteId });
    if (response.data.status) {
      setData((prevData) => prevData.filter((note) => note.id !== noteId));
      setOpenDeleteDialog(false);
      setNoteToDelete(null);
    }
    setSnackbarMessage(response.data.message);
    setSnackbarSuccess(response.data.status);
    setOpenSnackbar(true);
  };

  const confirmDeleteNote = (noteId) => {
    setNoteToDelete(noteId);
    setOpenDeleteDialog(true);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", padding: "10px"}}>
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          marginBottom: "20px",
          borderRadius: "12px",
          backgroundColor: colors.grey[800], // Paper background aligned with theme
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="20px">
          <Typography
            component="span"
            variant="h4"
            color={colors.primary[100]} // Primary text color
            fontSize={fontSize}
            fontWeight="bold"
          >
            Welcome to TinyNotie,{" "}
            {user && (
              <>
                Hello{" "}
                <span style={{ color: colors.primary[300], fontWeight: "700" }}>{user}</span>!
              </>
            )}
          </Typography>
          <IconButton onClick={handleLogout} aria-label="logout">
            <LogoutIcon sx={{ fill: colors.redAccent[500] }} />
          </IconButton>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: loading ? gridColItem : data.length === 0 ? "repeat(1,1fr)" : gridColItem,
          gridAutoFlow: "dense",
          gap: "20px",
        }}
      >
        {loading
          ? Array.from(new Array(10)).map((_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                width={"cal(100%/4)"}
                height={90}
                sx={{ borderRadius: "12px", backgroundColor: colors.grey[700] }} // Skeleton color
              />
            ))
          : data.length === 0
          ? (
            <Paper
              elevation={3}
              sx={{
                width: "100%",
                height: "50vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                padding: "20px",
                textAlign: "center",
                borderRadius: "12px",
                border: `1px solid ${colors.primary[700]}`, // Border using primary color
                backgroundColor: colors.grey[800], // Background for empty state
              }}
            >
              <Typography variant="h6" color={colors.primary[100]}>
                No notes found!
              </Typography>
              <Typography variant="body1" color={colors.primary[200]}>
                Click the button below to create your first note.
              </Typography>
              <Fab
                color="primary"
                aria-label="add"
                onClick={handleCreateGroup}
                sx={{
                  marginTop: "20px",
                  backgroundColor: colors.primary[500], // Primary color for Fab button
                  "&:hover": {
                    backgroundColor: colors.primary[700], // Hover color
                  },
                }}
              >
                <AddIcon />
              </Fab>
            </Paper>
          )
          : data
              .slice()
              .reverse()
              .map((item) => (
                <GroupCard
                  key={item.id}
                  item={item}
                  onDelete={confirmDeleteNote}
                  onClick={handleGroupClick}
                />
              ))}
      </Box>

      <Fab
        color="primary"
        aria-label="add"
        onClick={handleCreateGroup}
        sx={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          backgroundColor: colors.primary[500], // Floating button with primary color
          "&:hover": {
            backgroundColor: colors.primary[700],
          },
        }}
      >
        <AddIcon />
      </Fab>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography color={colors.grey[300]}>Are you sure you want to delete this note? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} sx={{ color: colors.primary[500] }}>
            Cancel
          </Button>
          <Button onClick={() => handleDeleteNote(noteToDelete)} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSuccess ? "success" : "error"} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
