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
import SpaceSky from "../component/SpaceSky";
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
    AUD: "Australian Dollar",
  };

  return (
    <Paper
      elevation={3}
      sx={{
        cursor: "pointer",
        padding: { xs: "10px", md: "12px" },
        borderRadius: "10px",
        border: `1px solid ${colors.primary[700]}88`,
        transition: "transform 0.3s, box-shadow 0.3s",
        "&:hover": {
          transform: "scale(1.03) translateZ(5px)",
          boxShadow: `0 5px 15px ${colors.primary[500]}55`,
        },
        position: "relative",
        backgroundColor: `${colors.grey[800]}cc`,
        backdropFilter: "blur(8px)",
        zIndex: 1,
      }}
      onClick={() => onClick(item)}
    >
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        color={colors.primary[100]}
        sx={{ fontSize: { xs: "0.9rem", md: "1rem" }, mb: 0.5 }}
      >
        {item.grp_name}
      </Typography>
      <Typography
        variant="body2"
        color={colors.grey[300]}
        sx={{ fontSize: { xs: "0.75rem", md: "0.8rem" }, mb: 0.25 }}
      >
        <span style={{ color: colors.primary[300] }}>
          {`Currency ${currencyObject[item.currency]}`}
        </span>
      </Typography>
      <Typography
        variant="body2"
        color={colors.grey[400]}
        sx={{ fontSize: { xs: "0.75rem", md: "0.8rem" } }}
      >
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
            top: 2,
            right: 2,
            color: colors.redAccent[500],
            padding: "4px",
          }}
          size="small"
        >
          <DeleteIcon fontSize="small" />
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
        position: "relative",
        backgroundColor: "transparent", // Changed to transparent to show the space background
      }}
    >
      {/* Add the 3D Space Sky background */}
      <SpaceSky />
      <Paper
        elevation={3}
        sx={{
          padding: { xs: "12px", md: "16px" },
          marginBottom: isNonMobile ? "16px" : "0px",
          borderRadius: "0px",
          backgroundColor: `${colors.grey[800]}dd`, // Added transparency
          backdropFilter: "blur(5px)",
          position: "relative",
          zIndex: 1,
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
            variant="h5"
            color={colors.primary[100]}
            sx={{
              fontSize: { xs: "1.1rem", md: "1.3rem" },
              fontWeight: "bold"
            }}
          >
            TinyNotie
          </Typography>

          <Box>
            <IconButton
              onClick={handleOpenProfileSettings}
              aria-label="profile"
              sx={{ padding: { xs: "6px", md: "8px" } }}
            >
              <img
                src={
                  profileData?.profile_url ||
                  defaultProfileImage
                } // Use shared profile data
                alt="Profile"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${colors.primary[500]}`,
                }}
              />
            </IconButton>
            <IconButton
              onClick={handleLogout}
              aria-label="logout"
              sx={{ padding: { xs: "6px", md: "8px" } }}
            >
              <LogoutIcon
                sx={{
                  fill: colors.redAccent[500],
                  fontSize: { xs: "1.2rem", md: "1.4rem" }
                }}
              />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {isNonMobile ? (
        <Box
          sx={{
            position: "fixed",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)", // Center it horizontally
            zIndex: 1300, // Above other elements
          }}
        >
          <Paper
            elevation={4} // Increased elevation for a floating effect
            sx={{
              display: "flex",
              padding: "6px 12px",
              borderRadius: "20px", // Rounded corners like a dock
              backgroundColor: `${colors.grey[900]}cc`, // Semi-transparent background
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${colors.primary[700]}44`,
              boxShadow: `0 5px 15px ${colors.primary[900]}88`,
            }}
          >
            <Lottie
              animationData={background1}
              loop={true}
              style={{
                position:"absolute",
                width: 180,
                top:"-70px",
                right:"70px",
                height: 180,
                mixBlendMode:"overlay",
                opacity: 0.8
              }}
            />
            <Button
              onClick={() => handleTabChange(null, 0)}
              color={tabIndex === 0 ? "primary" : "inherit"}
              disableRipple
              startIcon={<DescriptionOutlinedIcon sx={{ fontSize: "1.1rem" }} />}
              sx={{
                textTransform: "none",
                mx: 0.5,
                fontSize: "0.85rem",
                color:
                  tabIndex === 0 ? colors.primary[500] : colors.primary[100],
                ".MuiButtonBase-root:hover": {
                  backgroundColor: "none",
                },
                padding: "4px 8px",
              }}
            >
              My Notes
            </Button>
            <Button
              disableRipple
              onClick={() => handleTabChange(null, 1)}
              color={tabIndex === 1 ? "primary" : "inherit"}
              startIcon={<PeopleAltOutlinedIcon sx={{ fontSize: "1.1rem" }} />}
              sx={{
                textTransform: "none",
                mx: 0.5,
                fontSize: "0.85rem",
                color:
                  tabIndex === 1 ? colors.primary[500] : colors.primary[100],
                padding: "4px 8px",
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
            marginBottom: "10px",
            backgroundColor: `${colors.grey[800]}dd`,
            backdropFilter: "blur(5px)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Button
            onClick={() => handleTabChange(null, 0)}
            color={tabIndex === 0 ? "primary" : "inherit"}
            startIcon={<DescriptionOutlinedIcon sx={{ fontSize: "1rem" }} />}
            sx={{
              textTransform: "none",
              width: "50%", // Full width for mobile view
              borderRadius: "0", // No border radius
              color: tabIndex === 0 ? colors.primary[500] : colors.primary[100],
              fontSize: "0.8rem",
              padding: "6px 0",
            }}
            disableRipple
          >
            My Notes
          </Button>
          <Button
            disableRipple
            onClick={() => handleTabChange(null, 1)}
            color={tabIndex === 1 ? "primary" : "inherit"}
            startIcon={<PeopleAltOutlinedIcon sx={{ fontSize: "1rem" }} />}
            sx={{
              textTransform: "none",
              width: "50%", // Full width for mobile view
              borderRadius: "0", // No border radius
              color: tabIndex === 1 ? colors.primary[500] : colors.primary[100],
              fontSize: "0.8rem",
              padding: "6px 0",
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
          gap: { xs: "12px", md: "16px" },
          margin: { xs: "10px", md: "16px" },
          marginTop: "0px",
        }}
      >
        {loading ? (
          Array.from(new Array(6)).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              width={"100%"}
              height={"80px"}
              sx={{ borderRadius: "10px", backgroundColor: colors.grey[700] }}
            />
          ))
        ) : tabIndex === 0 && data.every((item) => !item.isAdmin) ? (
          // No notes created by the user
          <Paper
            elevation={2}
            sx={{
              width: "100%", // Ensure it takes the full width
              height: { xs: "50vh", md: "60vh" }, // Adjust height for better view
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              padding: { xs: "16px", md: "20px" },
              textAlign: "center",
              borderRadius: "10px",
              border: `1px solid ${colors.primary[700]}`,
              backgroundColor: colors.grey[800],
            }}
          >
            <Typography
              variant="subtitle1"
              color={colors.primary[100]}
              sx={{ fontSize: { xs: "0.9rem", md: "1rem" }, fontWeight: "bold" }}
            >
              No notes found!
            </Typography>
            <Typography
              variant="body2"
              color={colors.primary[200]}
              sx={{ fontSize: { xs: "0.8rem", md: "0.9rem" }, mt: 1 }}
            >
              Click the button below to create your first note.
            </Typography>
            <Fab
              color="primary"
              aria-label="add"
              size="small"
              onClick={handleCreateGroup}
              sx={{
                marginTop: "16px",
                backgroundColor: colors.primary[500],
                "&:hover": {
                  backgroundColor: colors.primary[700],
                },
              }}
            >
              <AddIcon fontSize="small" />
            </Fab>
          </Paper>
        ) : tabIndex === 1 && data.every((item) => item.isAdmin) ? (
          // No shared notes from other users
          <Paper
            elevation={2}
            sx={{
              width: "100%",
              height: { xs: "40vh", md: "50vh" },
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              padding: { xs: "16px", md: "20px" },
              textAlign: "center",
              borderRadius: "10px",
              backgroundColor: "transparent",
              boxShadow: "none",
            }}
          >
            <Typography
              variant="subtitle1"
              color={colors.primary[100]}
              sx={{ fontSize: { xs: "0.9rem", md: "1rem" }, fontWeight: "bold" }}
            >
              No shared notes found!
            </Typography>
            <Typography
              variant="body2"
              color={colors.primary[200]}
              sx={{ fontSize: { xs: "0.8rem", md: "0.9rem" }, mt: 1 }}
            >
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
          bottom: "12px",
          right: scrollDirection === "down" ? "-80px" : "12px", // Move out of view when scrolling down
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          transition: "right 0.3s ease-in-out", // Smooth transition
        }}
      >
        <Fab
          color="primary"
          aria-label="add"
          size="small"
          onClick={handleCreateGroup}
          sx={{
            backgroundColor: colors.primary[500],
            "&:hover": {
              backgroundColor: colors.primary[700],
              transform: "scale(1.1) translateZ(5px)",
              boxShadow: `0 5px 15px ${colors.primary[500]}88`,
            },
            width: "40px",
            height: "40px",
            transition: "transform 0.3s, box-shadow 0.3s, background-color 0.3s",
            boxShadow: `0 3px 10px ${colors.primary[900]}66`,
          }}
        >
          <AddIcon fontSize="small" />
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
            backgroundColor: `${colors.grey[900]}ee`,
            backdropFilter: "blur(10px)",
            borderRadius: "10px",
            padding: { xs: "12px", md: "16px" },
            color: colors.primary[100],
            border: `1px solid ${colors.primary[700]}44`,
            boxShadow: `0 10px 25px ${colors.primary[900]}aa`,
          },
        }}
      >
        <DialogTitle sx={{ padding: { xs: "8px 12px", md: "12px 16px" } }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon sx={{ color: colors.redAccent[500], fontSize: { xs: "1.2rem", md: "1.4rem" } }} />
            <Typography
              variant="subtitle1"
              sx={{
                color: colors.primary[500],
                fontSize: { xs: "0.9rem", md: "1rem" },
                fontWeight: "bold"
              }}
            >
              Confirm Delete
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ padding: { xs: "8px 12px", md: "12px 16px" } }}>
          <Typography
            variant="body2"
            color={colors.primary[300]}
            sx={{ fontSize: { xs: "0.8rem", md: "0.9rem" } }}
          >
            Are you sure you want to delete the <strong>{noteToDeleteName}</strong> note? <br />This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: { xs: "8px 12px", md: "12px 16px" } }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              color: colors.primary[500],
              textTransform: "none",
              fontWeight: "bold",
              fontSize: { xs: "0.75rem", md: "0.85rem" },
              padding: { xs: "4px 8px", md: "6px 12px" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteNote(noteToDelete)}
            color="secondary"
            disabled={deleting}
            startIcon={deleting && <CircularProgress size="0.9rem" />}
            sx={{
              backgroundColor: colors.redAccent[500],
              color: colors.grey[100],
              "&:hover": {
                backgroundColor: colors.redAccent[700],
              },
              textTransform: "none",
              fontWeight: "bold",
              fontSize: { xs: "0.75rem", md: "0.85rem" },
              padding: { xs: "4px 8px", md: "6px 12px" },
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
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '6px',
            fontSize: { xs: "0.75rem", md: "0.85rem" }
          }
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSuccess ? "success" : "error"}
          sx={{
            width: "100%",
            padding: { xs: "4px 8px", md: "6px 12px" },
            '& .MuiAlert-icon': {
              fontSize: { xs: "1.1rem", md: "1.2rem" },
              marginRight: { xs: "6px", md: "8px" }
            }
          }}
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
