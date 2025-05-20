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
import useWindowDimensions from "../hooks/useWindowDimensions";

const ImageCropper = ({ open, imageSrc, onClose, onCropComplete }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { dialogDimensions } = useWindowDimensions();

  // Determine optimal dialog dimensions based on screen size
  const {
    width: optimalWidth,
    maxWidth: optimalMaxWidth,
    sideMargin,
    isSmallDevice,
    isVerySmallDevice
  } = dialogDimensions;

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

  const onCropCompleteCallback = useCallback((_, croppedAreaPixels) => {
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
          backgroundColor: theme.palette.mode === 'dark' ? colors.grey[800] : colors.grey[100],
          backgroundImage: 'none',
          borderRadius: '12px',
          overflow: 'hidden',
          width: isNonMobile ? '500px' : `${optimalWidth}px`,
          maxWidth: isNonMobile ? '500px' : `${optimalMaxWidth}px`,
          margin: `${sideMargin}px`,
          position: 'relative',
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
        height: isNonMobile ? '400px' : isVerySmallDevice ? '300px' : isSmallDevice ? '320px' : '350px',
        position: 'relative',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.03)',
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
            cropSize={isNonMobile
              ? undefined
              : isVerySmallDevice
                ? { width: 200, height: 267 }
                : isSmallDevice
                  ? { width: 220, height: 293 }
                  : { width: 240, height: 320 }
            }
          />
        </Box>
      </DialogContent>

      <Box sx={{
        p: isNonMobile
          ? 2
          : isVerySmallDevice
            ? 1
            : isSmallDevice
              ? 1.25
              : 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: isNonMobile
          ? 1
          : isVerySmallDevice
            ? 0.75
            : 1,
        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isNonMobile ? 2 : 1 }}>
          <IconButton
            onClick={() => setZoom(Math.max(1, zoom - 0.1))}
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
              padding: isNonMobile ? '8px' : '10px', // Larger touch target on mobile
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ZoomOutIcon fontSize={isNonMobile ? 'medium' : 'small'} />
          </IconButton>

          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, newZoom) => setZoom(newZoom)}
            aria-labelledby="Zoom"
            sx={{
              color: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[500],
              '& .MuiSlider-thumb': {
                width: isNonMobile ? 12 : 16, // Larger thumb on mobile for easier touch
                height: isNonMobile ? 12 : 16,
              },
              '& .MuiSlider-rail': {
                opacity: 0.3,
                height: isNonMobile ? 2 : 4, // Thicker rail on mobile
              },
              '& .MuiSlider-track': {
                height: isNonMobile ? 2 : 4, // Thicker track on mobile
              }
            }}
          />

          <IconButton
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
              padding: isNonMobile ? '8px' : '10px', // Larger touch target on mobile
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ZoomInIcon fontSize={isNonMobile ? 'medium' : 'small'} />
          </IconButton>
        </Box>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          justifyContent: 'center' // Center on mobile for better thumb access
        }}>
          <IconButton
            onClick={() => setRotation((rotation + 90) % 360)}
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
              padding: isNonMobile ? '8px' : '12px', // Larger touch target on mobile
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <RotateRightIcon fontSize={isNonMobile ? 'medium' : 'small'} />
          </IconButton>

          <Typography
            variant={isNonMobile ? "body2" : "body1"}
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
              fontWeight: 500
            }}
          >
            Rotation: {rotation}°
          </Typography>
        </Box>
      </Box>

      <DialogActions sx={{
        justifyContent: isNonMobile ? 'space-between' : 'center',
        p: isNonMobile
          ? 2
          : isVerySmallDevice
            ? '12px 8px'
            : isSmallDevice
              ? '14px 10px'
              : '16px 12px',
        gap: isVerySmallDevice ? 1 : 2,
        flexDirection: isNonMobile ? 'row' : 'row',
        borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size={isVerySmallDevice ? "small" : "medium"}
          sx={{
            color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
            textTransform: 'none',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            padding: isNonMobile
              ? '6px 16px'
              : isVerySmallDevice
                ? '4px 10px'
                : isSmallDevice
                  ? '6px 12px'
                  : '8px 16px',
            minWidth: isNonMobile
              ? '80px'
              : isVerySmallDevice
                ? '70px'
                : isSmallDevice
                  ? '80px'
                  : '100px',
            fontSize: isNonMobile
              ? '0.875rem'
              : isVerySmallDevice
                ? '0.75rem'
                : isSmallDevice
                  ? '0.85rem'
                  : '1rem',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCrop}
          variant="contained"
          size={isVerySmallDevice ? "small" : "medium"}
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? colors.primary[500] : colors.primary[500],
            color: theme.palette.mode === 'dark' ? colors.grey[100] : 'white',
            textTransform: 'none',
            borderRadius: '8px',
            padding: isNonMobile
              ? '6px 16px'
              : isVerySmallDevice
                ? '4px 10px'
                : isSmallDevice
                  ? '6px 12px'
                  : '8px 16px',
            minWidth: isNonMobile
              ? '100px'
              : isVerySmallDevice
                ? '90px'
                : isSmallDevice
                  ? '100px'
                  : '120px',
            fontSize: isNonMobile
              ? '0.875rem'
              : isVerySmallDevice
                ? '0.75rem'
                : isSmallDevice
                  ? '0.85rem'
                  : '1rem',
            fontWeight: 600,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[600],
            },
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 10px rgba(0, 123, 255, 0.2)'
              : '0 4px 10px rgba(0, 123, 255, 0.15)',
          }}
        >
          Apply Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropper;
