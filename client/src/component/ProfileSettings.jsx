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
} from "@mui/material";
import { useUpdateUserInfoMutation, useUploadImageMutation, useLazyGetUserProfileQuery } from "../api/api"; // Import the uploadImage mutation and the query for fetching user profile
import imageCompression from "browser-image-compression"; // Import the image compression library

const MAX_IMAGE_SIZE_MB = 32; // Maximum allowed image size in MB for compression

const ProfileSettings = ({ open, onClose, user, profileData, setProfileData }) => {
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
    console.log(file);
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        // Compress the image if it exceeds the size limit
        try {
          const options = {
            maxSizeMB: MAX_IMAGE_SIZE_MB, // Maximum size in MB
            maxWidthOrHeight: 1920, // Resize the image to a maximum width or height
            useWebWorker: true, // Use a web worker for better performance
          };
          const compressedFile = await imageCompression(file, options);
          setImageFile(compressedFile); // Store the compressed file
          const reader = new FileReader();
          reader.onload = () => {
            setProfilePreview(reader.result); // Show preview of the compressed image
          };
          reader.readAsDataURL(compressedFile);
        } catch (error) {
          setSnackbarMessage("Error compressing image. Please try again.");
          setSnackbarSuccess(false);
          setOpenSnackbar(true);
          return;
        }
      } else {
        setImageFile(file); // Store the selected file
        const reader = new FileReader();
        reader.onload = () => {
          setProfilePreview(reader.result); // Show preview of the selected image
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      let uploadedImageUrl = formData.profile_url;

      // If a new image is selected, upload it
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append("image", imageFile); // Append the file with the key "image"

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
    <Dialog open={open} onClose={() => onClose(null)}>
      <DialogTitle>Profile Settings</DialogTitle>
      <DialogContent>
        {isFetching && !cachedProfile ? (
          <Skeleton variant="circular" width={100} height={100} sx={{ marginBottom: 2 }} />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 2,
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
              <img
                src={profilePreview || "https://tinynotie.vercel.app/icons/maskable_icon_x512.png"}
                alt="Profile Preview"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: 10,
                  position: "relative",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
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
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                padding: "4px 8px",
                borderRadius: "12px",
                fontWeight: "bold",
                marginTop: 1,
                fontSize: "12px",
                textAlign: "center",
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
        />
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            marginTop: 2,
            color: "gray",
            fontStyle: "italic",
          }}
        >
          Version: 0.2
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          disabled={isLoading || isUploading} // Disable save button while saving or uploading
        >
          Save
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
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ProfileSettings;
