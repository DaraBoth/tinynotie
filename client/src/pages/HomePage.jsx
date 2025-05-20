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
  Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
import SpaceSkyNew from "../component/SpaceSkyNew";
import { useDeleteGroupMutation, useGetGroupMutation, useLazyGetUserProfileQuery } from "../api/api";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import CheckIcon from "@mui/icons-material/Check";
import { rspWidth } from "../responsive";
import { tokens } from "../theme";
import { encodeObjectToBase64 } from "../help/helper";
import { formatTimeDifference } from "../help/time";
import moment from "moment";
import FloatingChat from "../component/ChatWithDatabase";
import ProfileSettings from "../component/ProfileSettings";
import defaultProfileImage from "../../public/default_profile.jpg";
import HomeTopbar from "../global/HomeTopbar";
import { Stack } from "@mui/system";
import useWindowDimensions from "../hooks/useWindowDimensions";

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
      component={motion.div}
      whileHover={{ y: -4 }}
      elevation={0}
      sx={{
        cursor: "pointer",
        padding: { xs: "16px", md: "18px" },
        borderRadius: "16px",
        border: `1px solid ${theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.08)'}`,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 20px rgba(0, 0, 0, 0.4)'
            : '0 8px 20px rgba(0, 0, 0, 0.1)',
        },
        position: "relative",
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(20, 23, 39, 0.6)'
          : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: "blur(8px)",
        zIndex: 1,
        overflow: "hidden",
      }}
      onClick={() => onClick(item)}
    >
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
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="subtitle1"
          fontWeight="600"
          color={theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800]}
          sx={{
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            mb: 1,
            letterSpacing: "-0.01em"
          }}
        >
          {item.grp_name}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: "0.75rem", md: "0.8rem" },
              color: theme.palette.mode === 'dark' ? colors.primary[300] : colors.primary[600],
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            {`${currencyObject[item.currency]}`}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: "0.75rem", md: "0.8rem" },
              color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            title={moment(item.create_date).format("YYYY-MM-DD hh:mm:ss (dd)")}
          >
            {`Created ${formatTimeDifference(item.create_date)}`}
          </Typography>
        </Box>
      </Box>

      {item.isAdmin && (
        <Tooltip title="Delete Group" placement="top" arrow>
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="delete group"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: colors.redAccent[500],
              padding: { xs: "8px", md: "10px" }, // Increased padding for larger touch target
              minWidth: { xs: "36px", md: "40px" }, // Ensure minimum width
              minHeight: { xs: "36px", md: "40px" }, // Ensure minimum height
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(0, 0, 0, 0.4)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: "blur(4px)",
              border: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 0, 0, 0.2)'
                : 'rgba(255, 0, 0, 0.1)'}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 10, // Ensure it's above other elements
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 0, 0, 0.2)'
                  : 'rgba(255, 0, 0, 0.1)',
              },
              '&:active': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 0, 0, 0.3)'
                  : 'rgba(255, 0, 0, 0.2)',
              }
            }}
            size="medium" // Changed from small to medium
          >
            <DeleteIcon sx={{ fontSize: { xs: "1.2rem", md: "1.3rem" } }} />
          </IconButton>
        </Tooltip>
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
  const [triggerDeleteGroup] = useDeleteGroupMutation();
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
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Define isMobile for responsive dialog
  const gridColItem = rspWidth("repeat(4,1fr)", "repeat(1,1fr)", "auto");
  const [openProfileSettings, setOpenProfileSettings] = useState(false); // State to control profile settings dialog
  const [profileViewMode, setProfileViewMode] = useState(false); // State to control view/edit mode
  const [getUserProfile, { data: userProfile }] = useLazyGetUserProfileQuery(); // Lazy query for user profile
  const [profileData, setProfileData] = useState(null); // Shared state for profile data
  const [scrollDirection, setScrollDirection] = useState("up"); // Track scroll direction
  const { dialogDimensions } = useWindowDimensions(); // Get responsive dialog dimensions

  // Determine optimal dialog dimensions based on screen size
  const {
    width: optimalWidth,
    maxWidth: optimalMaxWidth,
    sideMargin,
    isSmallDevice,
    isVerySmallDevice
  } = dialogDimensions;

  const handleTabChange = (_, newValue) => {
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
      <SpaceSkyNew />

      {/* Use the imported HomeTopbar component */}
      <HomeTopbar
        title="TinyNotie"
        onLogout={handleLogout}
        onProfileClick={handleOpenProfileSettings}
        profileImage={profileData?.profile_url || defaultProfileImage}
        scrollDirection={scrollDirection}
      />

      {/* Tab navigation - modern design for both mobile and desktop */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          marginBottom: "16px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            width: isNonMobile ? "auto" : "100%",
            padding: isNonMobile ? "4px" : "0px",
            borderRadius: isNonMobile ? "16px" : "0px",
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.6)'
              : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: "blur(8px)",
            overflow: "hidden",
            border: isNonMobile ? `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}` : "none",
          }}
        >
          <Button
            onClick={() => handleTabChange(null, 0)}
            disableRipple
            startIcon={<DescriptionOutlinedIcon sx={{ fontSize: isNonMobile ? "1.1rem" : "1rem" }} />}
            sx={{
              textTransform: "none",
              width: isNonMobile ? "auto" : "50%",
              borderRadius: isNonMobile ? "12px" : "0px",
              backgroundColor: tabIndex === 0
                ? theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)'
                : 'transparent',
              color: tabIndex === 0
                ? theme.palette.mode === 'dark'
                  ? colors.primary[300]
                  : colors.primary[600]
                : theme.palette.mode === 'dark'
                  ? colors.grey[300]
                  : colors.grey[700],
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              padding: isNonMobile ? "8px 16px" : "10px 0",
              transition: "all 0.2s ease",
              fontWeight: tabIndex === 0 ? 600 : 400,
              "&:hover": {
                backgroundColor: tabIndex !== 0
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.03)'
                  : theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.07)',
              },
            }}
          >
            My Notes
          </Button>

          <Button
            onClick={() => handleTabChange(null, 1)}
            disableRipple
            startIcon={<PeopleAltOutlinedIcon sx={{ fontSize: isNonMobile ? "1.1rem" : "1rem" }} />}
            sx={{
              textTransform: "none",
              width: isNonMobile ? "auto" : "50%",
              borderRadius: isNonMobile ? "12px" : "0px",
              backgroundColor: tabIndex === 1
                ? theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)'
                : 'transparent',
              color: tabIndex === 1
                ? theme.palette.mode === 'dark'
                  ? colors.primary[300]
                  : colors.primary[600]
                : theme.palette.mode === 'dark'
                  ? colors.grey[300]
                  : colors.grey[700],
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              padding: isNonMobile ? "8px 16px" : "10px 0",
              transition: "all 0.2s ease",
              fontWeight: tabIndex === 1 ? 600 : 400,
              "&:hover": {
                backgroundColor: tabIndex !== 1
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.03)'
                  : theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.07)',
              },
            }}
          >
            From Others
          </Button>
        </Paper>
      </Box>

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
            <Paper
              key={index}
              elevation={0}
              sx={{
                width: "100%",
                height: "100px",
                borderRadius: "16px",
                overflow: "hidden",
                position: "relative",
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)'}`,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(20, 23, 39, 0.4)'
                  : 'rgba(255, 255, 255, 0.4)',
                backdropFilter: "blur(8px)",
              }}
            >
              <Skeleton
                variant="rectangular"
                width={"60%"}
                height={"20px"}
                sx={{
                  borderRadius: "4px",
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                  position: "absolute",
                  top: "16px",
                  left: "16px"
                }}
              />
              <Skeleton
                variant="rectangular"
                width={"40%"}
                height={"16px"}
                sx={{
                  borderRadius: "4px",
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.07)'
                    : 'rgba(0, 0, 0, 0.07)',
                  position: "absolute",
                  top: "48px",
                  left: "16px"
                }}
              />
              <Skeleton
                variant="rectangular"
                width={"30%"}
                height={"16px"}
                sx={{
                  borderRadius: "4px",
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)',
                  position: "absolute",
                  top: "72px",
                  left: "16px"
                }}
              />
            </Paper>
          ))
        ) : tabIndex === 0 && data.every((item) => !item.isAdmin) ? (
          // No notes created by the user
          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            elevation={0}
            sx={{
              width: "100%",
              height: { xs: "50vh", md: "60vh" },
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              padding: { xs: "24px", md: "32px" },
              textAlign: "center",
              borderRadius: "20px",
              border: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.08)'}`,
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(20, 23, 39, 0.6)'
                : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: "blur(8px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle gradient overlay for depth */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "100px",
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                zIndex: 0,
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                variant="h6"
                color={theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800]}
                sx={{
                  fontSize: { xs: "1.1rem", md: "1.2rem" },
                  fontWeight: "600",
                  mb: 1,
                  letterSpacing: "-0.01em"
                }}
              >
                No notes found!
              </Typography>

              <Typography
                variant="body1"
                color={theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[600]}
                sx={{
                  fontSize: { xs: "0.85rem", md: "0.95rem" },
                  mb: 4,
                  maxWidth: "300px"
                }}
              >
                Click the button below to create your first note.
              </Typography>

              <Fab
                color="primary"
                aria-label="add"
                size="medium"
                onClick={handleCreateGroup}
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                sx={{
                  backgroundColor: colors.primary[500],
                  "&:hover": {
                    backgroundColor: colors.primary[600],
                  },
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                    : '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
              >
                <AddIcon />
              </Fab>
            </Box>
          </Paper>
        ) : tabIndex === 1 && data.every((item) => item.isAdmin) ? (
          // No shared notes from other users
          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            elevation={0}
            sx={{
              width: "100%",
              height: { xs: "40vh", md: "50vh" },
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              padding: { xs: "24px", md: "32px" },
              textAlign: "center",
              borderRadius: "20px",
              border: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.08)'}`,
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(20, 23, 39, 0.6)'
                : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: "blur(8px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle gradient overlay for depth */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "100px",
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                zIndex: 0,
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                variant="h6"
                color={theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800]}
                sx={{
                  fontSize: { xs: "1.1rem", md: "1.2rem" },
                  fontWeight: "600",
                  mb: 1,
                  letterSpacing: "-0.01em"
                }}
              >
                No shared notes found!
              </Typography>

              <Typography
                variant="body1"
                color={theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[600]}
                sx={{
                  fontSize: { xs: "0.85rem", md: "0.95rem" },
                  maxWidth: "300px"
                }}
              >
                Ask your friends to share their notes with you.
              </Typography>
            </Box>
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
          bottom: !isNonMobile ? "24px" : "12px", // Increased bottom margin on mobile
          right: scrollDirection === "down" ? "-80px" : (!isNonMobile ? "16px" : "12px"), // Move out of view when scrolling down
          display: "flex",
          flexDirection: "column",
          gap: "16px", // Increased gap between buttons
          transition: "right 0.3s ease-in-out", // Smooth transition
          zIndex: 1100, // Lower than dialogs (1300) but higher than most content
        }}
      >
        <Fab
          color="primary"
          aria-label="add"
          size="small"
          onClick={handleCreateGroup}
          component={motion.button}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          sx={{
            backgroundColor: colors.primary[500],
            "&:hover": {
              backgroundColor: colors.primary[600],
            },
            width: "48px",
            height: "48px",
            borderRadius: "50%", // Ensure perfect circle
            aspectRatio: "1/1", // Maintain aspect ratio
            transition: "background-color 0.3s",
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.4)'
              : '0 4px 12px rgba(0, 0, 0, 0.2)',
            zIndex: 1, // Local z-index within the container
          }}
        >
          <AddIcon fontSize={!isNonMobile ? "medium" : "small"} />
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
        sx={{
          zIndex: 1300, // Standard MUI Dialog z-index
          '& .MuiBackdrop-root': {
            zIndex: -1 // Relative to the dialog itself, not an absolute z-index
          }
        }}
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3 },
          sx: {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: {
              xs: isVerySmallDevice ? "12px" : isSmallDevice ? "14px" : "16px",
              md: "20px"
            },
            color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 25px rgba(0, 0, 0, 0.5)'
              : '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: "hidden",
            width: isMobile ? `${optimalWidth}px` : "auto",
            maxWidth: isMobile ? `${optimalMaxWidth}px` : "400px",
            minWidth: isMobile ? "auto" : "350px", // Smaller minWidth for confirmation dialog
            margin: `${sideMargin}px`,
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
            height: "60px",
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
            zIndex: 0,
          }}
        />

        <DialogTitle
          sx={{
            padding: {
              xs: isVerySmallDevice ? "0 0 12px 0" : isSmallDevice ? "0 0 14px 0" : "0 0 16px 0",
              md: "0 0 20px 0"
            },
            position: "relative",
            zIndex: 1
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 59, 59, 0.15)'
                  : 'rgba(255, 59, 59, 0.1)',
                borderRadius: "12px",
                padding: isVerySmallDevice ? "8px" : isSmallDevice ? "9px" : "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <WarningIcon
                sx={{
                  color: colors.redAccent[theme.palette.mode === 'dark' ? 400 : 600],
                  fontSize: {
                    xs: isVerySmallDevice ? "1.1rem" : isSmallDevice ? "1.2rem" : "1.3rem",
                    md: "1.5rem"
                  }
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                fontSize: {
                  xs: isVerySmallDevice ? "0.9rem" : isSmallDevice ? "0.95rem" : "1rem",
                  md: "1.1rem"
                },
                fontWeight: "600",
                letterSpacing: "-0.01em"
              }}
            >
              Confirm Delete
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{
          padding: {
            xs: isVerySmallDevice ? "0 0 8px 0" : isSmallDevice ? "0 0 10px 0" : "0",
            md: "0"
          },
          position: "relative",
          zIndex: 1
        }}>
          <Typography
            variant="body1"
            color={theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700]}
            sx={{
              fontSize: {
                xs: isVerySmallDevice ? "0.8rem" : isSmallDevice ? "0.85rem" : "0.85rem",
                md: "0.95rem"
              },
              lineHeight: 1.5,
              mb: isVerySmallDevice ? 2 : 3
            }}
          >
            Are you sure you want to delete <strong>"{noteToDeleteName}"</strong>? <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            padding: {
              xs: isVerySmallDevice ? "8px 0 0 0" : isSmallDevice ? "10px 0 0 0" : "0",
              md: "0"
            },
            display: "flex",
            justifyContent: "flex-end",
            gap: isVerySmallDevice ? "8px" : "12px",
            position: "relative",
            zIndex: 1
          }}
        >
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            variant="outlined"
            size={isVerySmallDevice ? "small" : "medium"}
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
              textTransform: "none",
              fontWeight: "500",
              fontSize: {
                xs: isVerySmallDevice ? "0.75rem" : "0.8rem",
                md: "0.9rem"
              },
              padding: {
                xs: isVerySmallDevice ? "4px 10px" : isSmallDevice ? "5px 12px" : "6px 16px",
                md: "8px 20px"
              },
              borderRadius: "8px",
              minWidth: isVerySmallDevice ? "60px" : isSmallDevice ? "70px" : "80px",
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={() => handleDeleteNote(noteToDelete)}
            variant="contained"
            size={isVerySmallDevice ? "small" : "medium"}
            disabled={deleting}
            startIcon={deleting && <CircularProgress size={isVerySmallDevice ? "0.8rem" : "1rem"} color="inherit" />}
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            sx={{
              backgroundColor: colors.redAccent[theme.palette.mode === 'dark' ? 500 : 600],
              color: "#fff",
              "&:hover": {
                backgroundColor: colors.redAccent[theme.palette.mode === 'dark' ? 600 : 700],
              },
              textTransform: "none",
              fontWeight: "500",
              fontSize: {
                xs: isVerySmallDevice ? "0.75rem" : "0.8rem",
                md: "0.9rem"
              },
              padding: {
                xs: isVerySmallDevice ? "4px 10px" : isSmallDevice ? "5px 12px" : "6px 16px",
                md: "8px 20px"
              },
              borderRadius: "8px",
              minWidth: isVerySmallDevice ? "80px" : isSmallDevice ? "90px" : "100px",
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 10px rgba(255, 59, 59, 0.2)'
                : '0 4px 10px rgba(255, 59, 59, 0.15)',
            }}
          >
            {deleting ? "Deleting..." : "Delete Note"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: "left" }}
        sx={{
          zIndex: 1700, // Higher than all dialogs and confirmation dialogs
          '& .MuiPaper-root': {
            borderRadius: '12px',
            fontSize: { xs: "0.8rem", md: "0.9rem" },
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 20px rgba(0, 0, 0, 0.4)'
              : '0 8px 20px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSuccess ? "success" : "error"}
          variant="filled"
          icon={snackbarSuccess ?
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckIcon fontSize="small" />
            </Box> :
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarningIcon fontSize="small" />
            </Box>
          }
          sx={{
            width: "100%",
            padding: { xs: "10px 16px", md: "12px 20px" },
            backgroundColor: snackbarSuccess
              ? theme.palette.mode === 'dark' ? '#2e7d32' : '#4caf50'
              : theme.palette.mode === 'dark' ? '#d32f2f' : '#f44336',
            '& .MuiAlert-icon': {
              fontSize: { xs: "1.1rem", md: "1.2rem" },
              marginRight: { xs: "10px", md: "12px" },
              padding: 0,
            },
            '& .MuiAlert-message': {
              padding: 0,
              fontWeight: 500,
            },
            '& .MuiAlert-action': {
              padding: 0,
              marginRight: 0,
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
