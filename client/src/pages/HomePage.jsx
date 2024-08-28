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
  CircularProgress,
  Slide,
  Stack,
} from "@mui/material";
import { useDeleteGroupMutation, useGetGroupMutation } from "../api/api";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
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
        border: `1px solid ${colors.primary[700]}`, 
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: `0 4px 20px ${colors.primary[900]}33`, 
        },
        position: "relative",
        backgroundColor: colors.grey[800], 
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
      {item.isAdmin && <IconButton
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
      </IconButton>}
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
  const [deleting, setDeleting] = useState(false);
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
    sessionStorage.removeItem("token")
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
    navigate("/group/"+item.id);
  };

  const handleDeleteNote = async (noteId) => {
    setDeleting(true);
    const response = await triggerDeleteGroup({ group_id: noteId });
    setDeleting(false);

    if (response.data.status) {
      setData((prevData) => prevData.filter((note) => note.id !== noteId));
      setOpenDeleteDialog(false);
      setNoteToDelete(null);
      setSnackbarSuccess(true);
    } else {
      setSnackbarSuccess(false);
    }

    setSnackbarMessage(response.data.message);
    setOpenSnackbar(true);
  };

  const confirmDeleteNote = (noteId) => {
    setNoteToDelete(noteId);
    setOpenDeleteDialog(true);
  };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", height:"100%", padding: "20px", backgroundColor: colors.primary[900] }}>
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          marginBottom: "20px",
          borderRadius: "12px",
          backgroundColor: colors.grey[800],
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="20px">
          <Typography
            component="span"
            variant="h4"
            color={colors.primary[100]}
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
                sx={{ borderRadius: "12px", backgroundColor: colors.grey[700] }} 
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
                border: `1px solid ${colors.primary[700]}`, 
                backgroundColor: colors.grey[800],
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
                  backgroundColor: colors.primary[500], 
                  "&:hover": {
                    backgroundColor: colors.primary[700], 
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
          backgroundColor: colors.primary[500], 
          "&:hover": {
            backgroundColor: colors.primary[700],
          },
        }}
      >
        <AddIcon />
      </Fab>

      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "up" }}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[900],
            borderRadius: "12px",
            padding: "20px",
            color: colors.primary[100],
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon sx={{ color: colors.redAccent[500] }} />
            <Typography variant="h6" sx={{ color: colors.primary[500] }}>
              Confirm Delete
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color={colors.primary[300]}>
            Are you sure you want to delete this note? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            sx={{ 
              color: colors.primary[500], 
              textTransform: "none", 
              fontWeight: "bold" 
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteNote(noteToDelete)}
            color="secondary"
            disabled={deleting}
            startIcon={deleting && <CircularProgress size="1rem" />}
            sx={{ 
              backgroundColor: colors.redAccent[500], 
              color: colors.grey[100],
              '&:hover': {
                backgroundColor: colors.redAccent[700],
              },
              textTransform: "none", 
              fontWeight: "bold" 
            }}
          >
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
