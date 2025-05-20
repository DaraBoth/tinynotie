import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Box,
  Typography,
  IconButton,
  useMediaQuery
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { tokens } from "../theme";
import getCroppedImg from "../utils/cropImage"; // Utility function to crop the image

const ImageCropper = ({ open, imageSrc, onClose, onCropComplete }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onRotationChange = (rotation) => {
    setRotation(rotation);
  };

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      // Pass rotation to the crop function
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, "receipt.jpg");
      onCropComplete(croppedImage); // Pass the cropped image to the parent component
    } catch (error) {
      console.error("Error cropping the image:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.mode === 'dark' ? colors.primary[500] : colors.grey[50],
          backgroundImage: 'none',
          borderRadius: '12px',
          overflow: 'hidden',
          width: isNonMobile ? '500px' : '100%',
          maxWidth: isNonMobile ? '500px' : '100%',
        }
      }}
    >
      <DialogTitle sx={{
        m: 0,
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Crop Receipt
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{
        p: 0,
        height: '400px',
        position: 'relative',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
      }}>
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={3 / 4} // Better aspect ratio for receipts
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteCallback}
            objectFit="contain"
          />
        </Box>
      </DialogContent>

      <Box sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => setZoom(Math.max(1, zoom - 0.1))}
            sx={{ color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700] }}
          >
            <ZoomOutIcon />
          </IconButton>

          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, zoom) => setZoom(zoom)}
            aria-labelledby="Zoom"
            sx={{
              color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
              },
            }}
          />

          <IconButton
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            sx={{ color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700] }}
          >
            <ZoomInIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => setRotation((rotation + 90) % 360)}
            sx={{ color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700] }}
          >
            <RotateRightIcon />
          </IconButton>

          <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700] }}>
            Rotation: {rotation}°
          </Typography>
        </Box>
      </Box>

      <DialogActions sx={{
        justifyContent: 'space-between',
        p: 2,
        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}>
        <Button
          onClick={onClose}
          sx={{
            color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCrop}
          variant="contained"
          sx={{
            bgcolor: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
            color: theme.palette.mode === 'dark' ? colors.primary[100] : 'white',
            textTransform: 'none',
            '&:hover': {
              bgcolor: colors.primary[theme.palette.mode === 'dark' ? 300 : 700],
            }
          }}
        >
          Apply Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropper;
