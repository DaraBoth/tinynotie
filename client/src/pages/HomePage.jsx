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
  Tabs,
  Tab,
} from "@mui/material";
import { useDeleteGroupMutation, useGetGroupMutation, useLazyGetUserProfileQuery } from "../api/api";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import { rspWidth } from "../responsive";
import { tokens } from "../theme";
import { encodeObjectToBase64 } from "../help/helper";
import { formatTimeDifference } from "../help/time";
import moment from "moment";
import FloatingChat from "../component/ChatWithDatabase";
import sleepingmeow from "../assets/sleepingmeow.json";
import background1 from "../assets/background1.json";
import Lottie from "lottie-react";
import ProfileSettings from "../component/ProfileSettings"; // Import the new component
import defaultProfileImage from "../../public/default_profile.jpg"; // Import the default profile image

function GroupCard({ item, onDelete, onClick }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const currencyObject = {
    W: "Korean Won",
    $: "US Dollar",
    R: "Khmer Reil",
  };

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
        {item.grp_name}
      </Typography>
      <Typography variant="body2" color={colors.grey[300]}>
        <span style={{ color: colors.primary[300] }}>
          {`Currency ${currencyObject[item.currency]}`}
        </span>
      </Typography>
      <Typography variant="body2" color={colors.grey[400]}>
        <span title={moment(item.create_date).format("YYYY-MM-DD hh:mm:ss (dd)")} style={{ color: colors.primary[300] }}>
          {`Since ${formatTimeDifference(item.create_date)}`}
        </span>
      </Typography>
      {item.isAdmin && (
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
      )}
    </Paper>
  );
}

export default function Home({
  user,
  setUser,
  secret,
  setGroupInfo,
  requestNotificationPermission,
}) {
  requestNotificationPermission(user);
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
  const [noteToDeleteName, setNoteToDeleteName] = useState(""); // Add state for group name
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const isMobile = useMediaQuery("(max-width:600px)");
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const widthItem = rspWidth("calc(100%/2)", "100%", "260px");
  const gridColItem = rspWidth("repeat(4,1fr)", "repeat(1,1fr)", "auto");
  const fontSize = rspWidth("normal", "18px", "16px");
  const [openProfileSettings, setOpenProfileSettings] = useState(false); // State to control profile settings dialog
  const [profileViewMode, setProfileViewMode] = useState(false); // State to control view/edit mode
  const [getUserProfile, { data: userProfile }] = useLazyGetUserProfileQuery(); // Lazy query for user profile
  const [profileData, setProfileData] = useState(null); // Shared state for profile data
  const [scrollDirection, setScrollDirection] = useState("up"); // Track scroll direction

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
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

  useEffect(() => {
    if (user && !profileData) {
      getUserProfile(); // Fetch user profile only if not already loaded
    }
  }, [user, getUserProfile, profileData]);

  useEffect(() => {
    if (userProfile?.status) {
      setProfileData(userProfile.data); // Set shared profile data
    }
  }, [userProfile]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY + 10) {
        setScrollDirection("down"); // User scrolled down
      } else if (currentScrollY < lastScrollY - 10) {
        setScrollDirection("up"); // User scrolled up
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    setUser(false);
    sessionStorage.removeItem("token");
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
    navigate(
      "/group/" +
        encodeObjectToBase64({
          groupId: item.id,
          groupName: item.grp_name,
          currency: item.currency,
        })
    );
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

  const confirmDeleteNote = (noteId, noteName) => {
    setNoteToDelete(noteId);
    setNoteToDeleteName(noteName); // Set the group name
    setOpenDeleteDialog(true);
  };

  const handleOpenProfileSettings = (viewMode = false) => {
    setProfileViewMode(viewMode);
    setOpenProfileSettings(true);
  };

  const handleCloseProfileSettings = (updatedProfile) => {
    setOpenProfileSettings(false);
    if (updatedProfile) {
      setProfileData(updatedProfile); // Update shared profile data
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        height: "100%",
        backgroundColor: colors.primary[900],
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          marginBottom: isNonMobile ? "20px" : "0px",
          borderRadius: "0px",
          backgroundColor: colors.grey[800],
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          position={"relative"}
        >
          <Typography
            component="span"
            variant="h4"
            color={colors.primary[100]}
            fontSize={fontSize}
            fontWeight="bold"
          >
            TinyNotie
          </Typography>

          <Box>
            <IconButton onClick={handleOpenProfileSettings} aria-label="profile">
              <img
                src={
                  profileData?.profile_url ||
                  defaultProfileImage
                } // Use shared profile data
                alt="Profile"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${colors.primary[500]}`,
                }}
              />
            </IconButton>
            <IconButton onClick={handleLogout} aria-label="logout">
              <LogoutIcon sx={{ fill: colors.redAccent[500] }} />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {isNonMobile ? (
        <Box
          sx={{
            position: "fixed",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)", // Center it horizontally
            zIndex: 1300, // Above other elements
          }}
        >
          <Paper
            elevation={6} // Slight elevation for a floating effect
            sx={{
              display: "flex",
              padding: "8px 16px",
              borderRadius: "24px", // Rounded corners like a dock
              backgroundColor: colors.grey[900], // Background color
              position:"relative",
              overflow:"hidden",
            }}
          >
            <Lottie
              animationData={background1}
              loop={true}
              style={{
                position:"absolute",
                width: 200,
                top:"-70px",
                right:"70px",
                height: 200,
                mixBlendMode:"overlay"
              }}
            />
            <Button
              onClick={() => handleTabChange(null, 0)}
              color={tabIndex === 0 ? "primary" : "inherit"}
              disableRipple
              startIcon={<DescriptionOutlinedIcon />}
              sx={{
                textTransform: "none",
                mx: 1,
                color:
                  tabIndex === 0 ? colors.primary[500] : colors.primary[100],
                ".MuiButtonBase-root:hover": {
                  backgroundColor: "none",
                },
              }}
            >
              My Notes
            </Button>
            <Button
              disableRipple
              onClick={() => handleTabChange(null, 1)}
              color={tabIndex === 1 ? "primary" : "inherit"}
              startIcon={<PeopleAltOutlinedIcon />}
              sx={{
                textTransform: "none",
                mx: 1,
                color:
                  tabIndex === 1 ? colors.primary[500] : colors.primary[100],
              }}
            >
              From Others
            </Button>
          </Paper>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginBottom: "16px",
            backgroundColor: colors.grey[800],
          }}
        >
          <Button
            onClick={() => handleTabChange(null, 0)}
            color={tabIndex === 0 ? "primary" : "inherit"}
            startIcon={<DescriptionOutlinedIcon />}
            sx={{
              textTransform: "none",
              width: "50%", // Full width for mobile view
              borderRadius: "0", // No border radius
              color: tabIndex === 0 ? colors.primary[500] : colors.primary[100],
            }}
            disableRipple
          >
            My Notes
          </Button>
          <Button
            disableRipple
            onClick={() => handleTabChange(null, 1)}
            color={tabIndex === 1 ? "primary" : "inherit"}
            startIcon={<PeopleAltOutlinedIcon />}
            sx={{
              textTransform: "none",
              width: "50%", // Full width for mobile view
              borderRadius: "0", // No border radius
              color: tabIndex === 1 ? colors.primary[500] : colors.primary[100],
            }}
          >
            From Others
          </Button>
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            !loading &&
            data.filter((item) =>
              tabIndex === 0 ? item.isAdmin : !item.isAdmin
            ).length === 0
              ? "1fr" // Make it take full width when no data
              : gridColItem,
          gridAutoFlow: "dense",
          gap: "20px",
          margin: "20px",
          marginTop: "0px",
        }}
      >
        {loading ? (
          Array.from(new Array(6)).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              width={"100%"}
              height={"100px"}
              sx={{ borderRadius: "12px", backgroundColor: colors.grey[700] }}
            />
          ))
        ) : tabIndex === 0 && data.every((item) => !item.isAdmin) ? (
          // No notes created by the user
          <Paper
            elevation={3}
            sx={{
              width: "100%", // Ensure it takes the full width
              height: "60vh", // Adjust height for better view
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
        ) : tabIndex === 1 && data.every((item) => item.isAdmin) ? (
          // No shared notes from other users
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
              backgroundColor: "transparent",
              boxShadow: "none",
            }}
          >
            <Typography variant="h6" color={colors.primary[100]}>
              No shared notes found!
            </Typography>
            <Typography variant="body1" color={colors.primary[200]}>
              Ask your friends to share their notes with you.
            </Typography>
          </Paper>
        ) : (
          data
            .filter((item) => (tabIndex === 0 ? item.isAdmin : !item.isAdmin)) // Filter notes based on the tab
            .slice()
            .reverse()
            .map((item) => (
              <GroupCard
                key={item.id}
                item={item}
                onDelete={(id) => confirmDeleteNote(id, item.grp_name)} // Pass group name to confirmDeleteNote
                onClick={handleGroupClick}
              />
            ))
        )}
      </Box>

      {/* Floating Buttons Container */}
      <Box
        sx={{
          position: "fixed",
          bottom: "16px",
          right: scrollDirection === "down" ? "-80px" : "16px", // Move out of view when scrolling down
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          transition: "right 0.3s ease-in-out", // Smooth transition
        }}
      >
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleCreateGroup}
          sx={{
            backgroundColor: colors.primary[500],
            "&:hover": {
              backgroundColor: colors.primary[700],
            },
          }}
        >
          <AddIcon />
        </Fab>

        <FloatingChat
          userId={user}
          scrollDirection={scrollDirection} // Pass scrollDirection to FloatingChat
        />
      </Box>

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
            Are you sure you want to delete the <strong>{noteToDeleteName}</strong> note? <br />This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              color: colors.primary[500],
              textTransform: "none",
              fontWeight: "bold",
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
              "&:hover": {
                backgroundColor: colors.redAccent[700],
              },
              textTransform: "none",
              fontWeight: "bold",
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
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSuccess ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <ProfileSettings
        open={openProfileSettings}
        onClose={handleCloseProfileSettings}
        user={user}
        profileData={profileData} // Pass shared profile data
        setProfileData={setProfileData} // Allow updating shared profile data
        viewMode={profileViewMode} // Pass view/edit mode
      />
    </Box>
  );
}
