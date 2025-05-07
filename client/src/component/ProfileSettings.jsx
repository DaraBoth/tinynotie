import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  Box,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import { useUpdateUserInfoMutation, useUploadImageMutation, useLazyGetUserProfileQuery } from "../api/api"; // Import the uploadImage mutation and the query for fetching user profile
import imageCompression from "browser-image-compression"; // Import the image compression library
import defaultProfileImage from "../../public/default_profile.jpg"; // Import the default profile image
import ImageCropper from "./ImageCropper"; // Import the ImageCropper component
import { tokens } from "../theme";

const MAX_IMAGE_SIZE_MB = 32; // Maximum allowed image size in MB for compression

const ProfileSettings = ({ open, onClose, user, profileData, setProfileData }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [formData, setFormData] = useState({});
  const [profilePreview, setProfilePreview] = useState(""); // For previewing uploaded image
  const [getUserProfile, { data: fetchedProfile, isFetching }] = useLazyGetUserProfileQuery(); // Lazy query for user profile
  const [updateUserInfo, { isLoading }] = useUpdateUserInfoMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation(); // Use the uploadImage mutation
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null); // Store the selected image file
  const [cachedProfile, setCachedProfile] = useState(null); // Cache for user profile
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  useEffect(() => {
    if (open && !cachedProfile) {
      getUserProfile(); // Fetch user profile only if not cached
    }
  }, [open, cachedProfile, getUserProfile]);

  useEffect(() => {
    if (fetchedProfile?.status && !cachedProfile) {
      setCachedProfile(fetchedProfile.data); // Cache the user profile
      setFormData(fetchedProfile.data); // Initialize form data
      setProfilePreview(fetchedProfile.data.profile_url || ""); // Set profile preview
    }
  }, [fetchedProfile, cachedProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result); // Set the image to crop
        setCropperOpen(true); // Open the cropper dialog
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile) => {
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePreview(reader.result); // Set the cropped image preview
    };
    reader.readAsDataURL(croppedFile);
    setImageFile(croppedFile); // Store the cropped File object
  };

  const handleSubmit = async () => {
    try {
      let uploadedImageUrl = formData.profile_url;

      // If a new image is selected, upload it
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append("image", imageFile); // Append the File object

          const response = await uploadImage(formData).unwrap(); // Use the mutation to upload the image

          if (response.status) {
            uploadedImageUrl = response.data.url; // Use the uploaded image URL
            setFormData((prevData) => ({
              ...prevData,
              profile_url: uploadedImageUrl,
            }));
          } else {
            throw new Error(response.message || "Failed to upload image.");
          }
        } catch (error) {
          if (error.status === 413) {
            setSnackbarMessage("Image is too large. Please upload an image smaller than 50 MB.");
          } else {
            const errorMessage = error.data?.message || error.message || "Error uploading image.";
            setSnackbarMessage(errorMessage);
          }
          setSnackbarSuccess(false);
          setOpenSnackbar(true);
          return; // Stop further execution if image upload fails
        }
      }

      // Save profile settings after successful image upload or if no image is selected
      const response = await updateUserInfo({ ...formData, profile_url: uploadedImageUrl }).unwrap();
      setSnackbarMessage(response.message);
      setSnackbarSuccess(response.status);
      setOpenSnackbar(true);

      if (response.status) {
        setProfileData({ ...formData, profile_url: uploadedImageUrl }); // Update shared profile data
        setCachedProfile({ ...formData, profile_url: uploadedImageUrl }); // Update cached profile
        onClose({ ...formData, profile_url: uploadedImageUrl }); // Pass updated profile data to parent
      }
    } catch (error) {
      const errorMessage = error.data?.message || error.message || "Error saving profile settings.";
      setSnackbarMessage(`Save Error: ${errorMessage}`);
      setSnackbarSuccess(false);
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => onClose(null)}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)'}`,
            overflow: 'hidden',
            maxWidth: '450px',
            width: '100%',
            margin: { xs: '16px', md: 'auto' },
            position: 'relative',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(40, 43, 59, 0.2) 0%, rgba(20, 23, 39, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(240, 240, 240, 0.2) 100%)',
              zIndex: -1,
            }
          }
        }}
      >
        <DialogTitle sx={{
          textAlign: 'center',
          fontSize: { xs: '1.2rem', md: '1.5rem' },
          fontWeight: 600,
          color: theme.palette.mode === 'dark' ? '#fff' : '#333',
          pt: 3,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)'}`,
        }}>
          Profile Settings
        </DialogTitle>
        <DialogContent sx={{
          p: { xs: 2, md: 3 },
          mt: 1
        }}>
          {isFetching && !cachedProfile ? (
            <Skeleton variant="circular" width={100} height={100} sx={{
              marginBottom: 2,
              margin: '0 auto',
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
            }} />
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: 3,
                position: "relative",
              }}
            >
              <input
                type="file"
                accept="image/*"
                hidden
                id="profile-upload"
                onChange={handleFileChange}
              />
              <label htmlFor="profile-upload" style={{ position: "relative", cursor: "pointer" }}>
                <Box sx={{
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  padding: '5px',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(145deg, rgba(66, 66, 255, 0.5), rgba(120, 100, 255, 0.5))'
                    : 'linear-gradient(145deg, rgba(100, 100, 255, 0.3), rgba(150, 130, 255, 0.3))',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0, 0, 0, 0.4)'
                    : '0 4px 20px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 2,
                }}>
                  <img
                    src={profilePreview || defaultProfileImage}
                    alt="Profile Preview"
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      objectFit: "cover",
                      position: "relative",
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    position: "absolute",
                    top: 5,
                    left: 5,
                    width: 100,
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "bold",
                    textAlign: "center",
                    borderRadius: "50%",
                    opacity: 0,
                    transition: "opacity 0.3s",
                    "&:hover": {
                      opacity: 1,
                    },
                  }}
                >
                  upload image
                </Box>
              </label>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(66, 66, 255, 0.2)'
                    : 'rgba(100, 100, 255, 0.1)',
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  marginTop: 1,
                  fontSize: "12px",
                  textAlign: "center",
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'}`,
                }}
              >
                @{user}
              </Typography>
            </Box>
          )}
          <TextField
            margin="dense"
            name="phone_number"
            label="Phone Number"
            type="text"
            fullWidth
            variant="standard"
            value={formData.phone_number || ""}
            onChange={handleChange}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                color: theme.palette.mode === 'dark' ? '#fff' : '#333',
              },
              "& .MuiInputLabel-root": {
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              },
              "& .MuiInput-underline:before": {
                borderBottomColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
              "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                borderBottomColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
              },
            }}
          />
          <TextField
            margin="dense"
            name="first_name"
            label="First Name"
            type="text"
            fullWidth
            variant="standard"
            value={formData.first_name || ""}
            onChange={handleChange}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                color: theme.palette.mode === 'dark' ? '#fff' : '#333',
              },
              "& .MuiInputLabel-root": {
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              },
              "& .MuiInput-underline:before": {
                borderBottomColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
              "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                borderBottomColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
              },
            }}
          />
          <TextField
            margin="dense"
            name="last_name"
            label="Last Name"
            type="text"
            fullWidth
            variant="standard"
            value={formData.last_name || ""}
            onChange={handleChange}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                color: theme.palette.mode === 'dark' ? '#fff' : '#333',
              },
              "& .MuiInputLabel-root": {
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              },
              "& .MuiInput-underline:before": {
                borderBottomColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
              "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                borderBottomColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
              },
            }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="standard"
            value={formData.email || ""}
            onChange={handleChange}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                color: theme.palette.mode === 'dark' ? '#fff' : '#333',
              },
              "& .MuiInputLabel-root": {
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              },
              "& .MuiInput-underline:before": {
                borderBottomColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              },
              "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                borderBottomColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              marginTop: 2,
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              fontStyle: "italic",
            }}
          >
            Version: 0.2
          </Typography>
        </DialogContent>
        <DialogActions sx={{
          padding: { xs: "16px 24px 24px", md: "20px 24px 24px" },
          position: "relative",
          zIndex: 1,
          borderTop: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)'}`,
          marginTop: 2,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1
        }}>
          <Button
            onClick={onClose}
            sx={{
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
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
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isUploading}
            variant="contained"
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 255, 0.8)' : 'rgba(66, 66, 255, 0.9)',
              color: "#fff",
              textTransform: "none",
              fontWeight: "500",
              fontSize: { xs: "0.8rem", md: "0.9rem" },
              padding: { xs: "6px 16px", md: "8px 20px" },
              borderRadius: "8px",
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 10px rgba(0, 0, 0, 0.3)'
                : '0 4px 10px rgba(0, 123, 255, 0.2)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 255, 0.9)' : 'rgba(66, 66, 255, 1)',
              },
              '&.Mui-disabled': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 255, 0.3)' : 'rgba(66, 66, 255, 0.4)',
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.7)',
              }
            }}
          >
            {isLoading || isUploading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbarSuccess ? "success" : "error"}
            sx={{
              width: "100%",
              backdropFilter: 'blur(10px)',
              backgroundColor: snackbarSuccess
                ? (theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.9)' : 'rgba(46, 125, 50, 0.9)')
                : (theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.9)' : 'rgba(211, 47, 47, 0.9)'),
              color: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Dialog>
      <ImageCropper
        open={cropperOpen}
        imageSrc={imageToCrop}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </>
  );
};

export default ProfileSettings;
