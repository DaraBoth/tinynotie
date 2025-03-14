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
} from "@mui/material";
import { useUpdateUserInfoMutation, useLazyGetUserProfileQuery, useUploadImageMutation } from "../api/api"; // Import the uploadImage mutation
import imageCompression from "browser-image-compression"; // Import the image compression library

const MAX_IMAGE_SIZE_MB = 32; // Maximum allowed image size in MB for compression

const ProfileSettings = ({ open, onClose, user }) => {
  const [formData, setFormData] = useState({
    profile_url: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    email: "",
  });
  const [profilePreview, setProfilePreview] = useState(""); // For previewing uploaded image
  const [getUserProfile, { data: userProfile, isFetching }] = useLazyGetUserProfileQuery();
  const [updateUserInfo, { isLoading }] = useUpdateUserInfoMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation(); // Use the uploadImage mutation
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null); // Store the selected image file

  useEffect(() => {
    if (open) {
      getUserProfile();
    }
  }, [open, getUserProfile]);

  useEffect(() => {
    if (userProfile?.status) {
      setFormData((prevData) => ({
        ...prevData,
        ...userProfile.data,
      }));
      setProfilePreview(userProfile.data.profile_url || ""); // Set initial profile picture
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
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
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Image = reader.result.split(",")[1]; // Extract base64 data
            const response = await uploadImage(base64Image).unwrap(); // Use the mutation to upload the image

            if (response.status) {
              uploadedImageUrl = response.data.url; // Use the uploaded image URL
              setFormData((prevData) => ({
                ...prevData,
                profile_url: uploadedImageUrl,
              }));
            } else {
              throw new Error(response.message || "Failed to upload image.");
            }

            // Proceed to save profile settings after successful image upload
            await saveProfileSettings(uploadedImageUrl);
          } catch (error) {
            if (error.status === 413) {
              // Handle 413 Payload Too Large error
              setSnackbarMessage("Image is too large. Please upload a smaller image.");
            } else {
              const errorMessage = error.data?.message || error.message || "Error uploading image.";
              setSnackbarMessage(`Image Upload Error: ${errorMessage}`);
            }
            setSnackbarSuccess(false);
            setOpenSnackbar(true);
          }
        };
        reader.readAsDataURL(imageFile);
        return; // Wait for the image upload to complete before proceeding
      }

      // If no new image is selected, save profile settings directly
      await saveProfileSettings(uploadedImageUrl);
    } catch (error) {
      const errorMessage = error.data?.message || error.message || "Error saving profile settings.";
      setSnackbarMessage(`Save Error: ${errorMessage}`);
      setSnackbarSuccess(false);
      setOpenSnackbar(true);
    }
  };

  const saveProfileSettings = async (uploadedImageUrl) => {
    try {
      const response = await updateUserInfo({ ...formData, profile_url: uploadedImageUrl }).unwrap();
      setSnackbarMessage(response.message);
      setSnackbarSuccess(response.status);
      setOpenSnackbar(true);

      if (response.status) {
        onClose(); // Close the dialog only if the save is successful
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
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Profile Settings</DialogTitle>
        <DialogContent>
          {isFetching ? (
            <>
              <Skeleton variant="circular" width={100} height={100} sx={{ marginBottom: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ marginBottom: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ marginBottom: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ marginBottom: 2 }} />
            </>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginBottom: 2,
                }}
              >
                <img
                  src={profilePreview || "https://tinynotie.vercel.app/icons/maskable_icon_x512.png"}
                  alt="Profile Preview"
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: 10,
                  }}
                />
                <Button
                  variant="contained"
                  component="label"
                  disabled={isUploading} // Disable button while uploading
                >
                  {isUploading ? "Uploading..." : "Upload Picture"}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </Box>
              <TextField
                margin="dense"
                name="phone_number"
                label="Phone Number"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.phone_number}
                onChange={handleChange}
              />
              <TextField
                margin="dense"
                name="first_name"
                label="First Name"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.first_name}
                onChange={handleChange}
              />
              <TextField
                margin="dense"
                name="last_name"
                label="Last Name"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.last_name}
                onChange={handleChange}
              />
              <TextField
                margin="dense"
                name="email"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={formData.email}
                onChange={handleChange}
              />
            </>
          )}
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
      </Dialog>
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
    </>
  );
};

export default ProfileSettings;
