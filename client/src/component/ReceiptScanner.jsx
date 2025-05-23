import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  IconButton,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Paper from "@mui/material/Paper";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import NoPhotographyRoundedIcon from "@mui/icons-material/NoPhotographyRounded";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import CropIcon from "@mui/icons-material/Crop";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import {
  usePostAddMultipleTripsMutation,
  useReceiptImageMutation,
} from "../api/api";
import { tokens } from "../theme";
import { useTheme } from "@mui/material/styles";
import ImageCropper from "./ImageCropper";

const StickyIconButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: 5,
  right: 5,
  zIndex: 1,
  color: theme.palette.mode === 'dark' ? tokens(theme.palette.mode).primary[100] : tokens(theme.palette.mode).primary[900],
}));

const ReceiptScanner = ({
  triggerMember,
  triggerTrips,
  member,
  trips,
  group_id,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [tableData, setTableData] = useState([]);
  const [isProcessing, setIsProcessing] = useState("No image uploaded yet");
  const [validationError, setValidationError] = useState(null);
  const [imageStatus, setImageStatus] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [triggerReceiptImage, resultReceiptImage] = useReceiptImageMutation();
  const [triggerAddMultipleTrips, resultAddMultipleTrips] =
    usePostAddMultipleTripsMutation();
  const [showCameraAndUpload, setShowCameraAndUpload] = useState(true);
  const [accordionExpanded, setAccordionExpanded] = useState(true); // Default open
  const [errorMessages, setErrorMessages] = useState([]); // For failed trip submissions
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? colors.grey[800] : colors.grey[100],
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
    flexGrow: 1,
    width: !isNonMobile && "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "50px",
    position: "relative", // For sticky buttons
  }));

  useEffect(() => {
    // Handle result from receipt image processing
    if (resultReceiptImage.isSuccess && resultReceiptImage.data) {
      let responseText = resultReceiptImage.data.text;

      try {
        if (
          typeof responseText === "string" &&
          (responseText.includes("JSON") || responseText.includes("json"))
        ) {
          // Clean the escaped string by removing escape sequences
          responseText = responseText
            .replace("JSON", "")
            .replace("json", "")
            .replace("\n", "")
            .replaceAll("```", "");
        }

        // Parse AI results
        const parsedData = JSON.parse(responseText);

        if (parsedData && Array.isArray(parsedData.data)) {
          setIsProcessing("Done!");
          setTimeout(() => {
            setIsProcessing(null);
          }, 2000);
          setTableData(
            parsedData.data.map((row, index) => ({
              id: index + 1,
              group_id,
              ...row,
              mem_id: "[]",
            }))
          );
          setAccordionExpanded(false); // Auto-close accordion when data received
        } else {
          setIsProcessing("");
        }

        // Clear image preview but keep status for reference
        setImagePreview(null);
        resetImageInput();
      } catch (e) {
        setIsProcessing("Error parsing JSON");
        console.error("Error parsing JSON:", e);
      }
    } else if (resultReceiptImage.isError) {
      setIsProcessing("Error processing image.");
      resetImageInput();
    }
  }, [resultReceiptImage, group_id]);

  const handleCameraClick = () => {
    if (isNonMobile) return;
    cameraInputRef.current.click();
  };

  const handleUploadClick = () => {
    uploadInputRef.current.click();
  };

  const resetImageInput = () => {
    if (cameraInputRef.current) cameraInputRef.current.value = null;
    if (uploadInputRef.current) uploadInputRef.current.value = null;
  };

  const handleRemoveImage = () => {
    resetImageInput();
    setImageStatus(null);
    setImagePreview(null);
    setSelectedFile(null);
    setIsProcessing("No image uploaded yet");
    setTableData([]);
  };

  const handleCropComplete = (croppedFile) => {
    setCropperOpen(false);
    setSelectedFile(croppedFile);

    // Create a preview URL for the cropped image
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(croppedFile);

    // Process the cropped image
    processReceiptImage(croppedFile);
  };

  const processReceiptImage = async (file) => {
    setIsProcessing("Processing image...");

    try {
      // Create a FormData object to send the image
      const formData = new FormData();
      formData.append('receipt', file);

      // Send the image to the server for processing
      await triggerReceiptImage(formData);
      setIsProcessing("AI analyzing image...");
    } catch (error) {
      console.error("Error processing image:", error);
      setIsProcessing("Error processing image.");
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageStatus(file.name);

      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessRowUpdate = (newRow, oldRow) => {
    const isNameValid = typeof newRow.trp_name === "string" && newRow.trp_name.trim() !== "";
    const isSpendValid = !isNaN(newRow.spend);

    if (!isNameValid || !isSpendValid) {
      setValidationError(
        "Invalid data: 'Name' must be a non-empty string and 'Spend' must be a number."
      );
      return oldRow;
    }

    setValidationError(null);
    const updatedRows = tableData.map((row) =>
      row.id === newRow.id ? newRow : row
    );
    setTableData(updatedRows);
    return newRow;
  };

  const handleConfirm = async () => {
    setErrorMessages([]);
    setIsProcessing("Adding all trips....");

    // Validate that all trips have a name
    const invalidTrips = tableData.filter((trip) => !trip.trp_name || trip.trp_name.trim() === "");
    if (invalidTrips.length > 0) {
      console.log("Invalid trips:", invalidTrips); // Add logging for debugging
      setValidationError("All trips must have a name.");
      setIsProcessing(null);
      return;
    }

    try {
      const response = await triggerAddMultipleTrips({ trips: tableData });

      const results = response.data.results;
      const failedTrips = [];
      results.forEach((result, index) => {
        if (!result.status) {
          failedTrips.push(tableData[index]); // Keep failed trips
          setErrorMessages((prevMessages) => [...prevMessages, result.message]); // Add error message
          setIsProcessing(null);
        }
      });

      setTableData(failedTrips);

      if (failedTrips.length === 0) {
        setIsProcessing("All trips added successfully!");
        setTimeout(() => setIsProcessing(null), 2000);
      }
      triggerTrips({ group_id });
    } catch (error) {
      console.error("Error adding trips:", error);
      setIsProcessing("Error adding trips. Please try again.");
    }
  };

  const handleAddRow = () => {
    const newRow = {
      id: tableData.length + 1,
      trp_name: `New trip ${tableData.length + 1}`,
      spend: 0,
      mem_id: "[]",
      group_id,
      create_date: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    setTableData([...tableData, newRow]);
  };

  // Function to remove a row
  const handleRemoveRow = (id) => {
    const updatedTableData = tableData.filter((row) => row.id !== id);
    setTableData(updatedTableData);
  };

  const handleAccordionChange = () => {
    setAccordionExpanded(prevState => !prevState);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'rgba(20, 23, 39, 0.4)'
            : 'rgba(255, 255, 255, 0.4)',
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          border: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)'}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? colors.grey[200] : colors.grey[800],
            }}
          >
            Upload Receipt Image
          </Typography>

          <IconButton
            onClick={handleAccordionChange}
            size="small"
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)',
              borderRadius: "8px",
              padding: "6px",
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            {!accordionExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>

        {accordionExpanded && showCameraAndUpload && (
          <Box
            sx={{
              display: "flex",
              flexDirection: isNonMobile ? "row" : "column",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginTop: "8px",
            }}
          >
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(20, 23, 39, 0.6)'
                  : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: "blur(4px)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: isNonMobile ? "48%" : "100%",
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)'}`,
                transition: "all 0.2s ease",
                cursor: isNonMobile ? "default" : "pointer",
                '&:hover': {
                  transform: "translateY(-2px)",
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 12px rgba(0, 0, 0, 0.3)'
                    : '0 6px 12px rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={handleCameraClick}
            >
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(0, 123, 255, 0.15)'
                    : 'rgba(0, 123, 255, 0.1)',
                  borderRadius: "50%",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "8px",
                }}
              >
                <PhotoCameraIcon
                  sx={{
                    color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                    fontSize: "1.5rem"
                  }}
                />
              </Box>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.mode === 'dark' ? colors.grey[200] : colors.grey[800],
                  fontWeight: 500,
                }}
              >
                Camera
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                  textAlign: "center",
                  marginTop: "4px",
                }}
              >
                {isNonMobile ? "Not available on desktop" : "Take a photo of your receipt"}
              </Typography>
            </Box>

            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(20, 23, 39, 0.6)'
                  : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: "blur(4px)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: isNonMobile ? "48%" : "100%",
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)'}`,
                transition: "all 0.2s ease",
                cursor: "pointer",
                '&:hover': {
                  transform: "translateY(-2px)",
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 12px rgba(0, 0, 0, 0.3)'
                    : '0 6px 12px rgba(0, 0, 0, 0.1)',
                },
              }}
              onClick={imagePreview ? null : handleUploadClick}
            >
              {imagePreview ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    gap: "12px",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxHeight: "200px",
                      overflow: "hidden",
                      borderRadius: "10px",
                      border: `1px solid ${theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.08)'}`,
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(0, 0, 0, 0.02)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 8px rgba(0, 0, 0, 0.4)'
                        : '0 4px 8px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Receipt preview"
                      style={{
                        width: "100%",
                        objectFit: "contain",
                        maxHeight: "200px",
                        display: "block",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      gap: "8px",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                        fontWeight: 500,
                        textAlign: "center",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {imageStatus}
                    </Typography>

                    <Box sx={{ display: "flex", gap: "8px" }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CropIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropperOpen(true);
                        }}
                        sx={{
                          textTransform: "none",
                          borderRadius: "8px",
                          minWidth: "auto",
                          padding: "4px 8px",
                          color: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[500],
                          borderColor: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[500],
                          '&:hover': {
                            borderColor: theme.palette.mode === 'dark' ? colors.primary[300] : colors.primary[600],
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(120, 123, 212, 0.1)' : 'rgba(45, 194, 255, 0.1)',
                          }
                        }}
                      >
                        Crop
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        sx={{
                          textTransform: "none",
                          borderRadius: "8px",
                          minWidth: "auto",
                          padding: "4px 8px",
                          color: theme.palette.mode === 'dark' ? colors.redAccent[400] : colors.redAccent[500],
                          borderColor: theme.palette.mode === 'dark' ? colors.redAccent[400] : colors.redAccent[500],
                          '&:hover': {
                            borderColor: theme.palette.mode === 'dark' ? colors.redAccent[300] : colors.redAccent[600],
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 114, 108, 0.1)' : 'rgba(255, 82, 81, 0.1)',
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(0, 123, 255, 0.15)'
                        : 'rgba(0, 123, 255, 0.1)',
                      borderRadius: "50%",
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <UploadIcon
                      sx={{
                        color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                        fontSize: "1.5rem"
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.mode === 'dark' ? colors.grey[200] : colors.grey[800],
                      fontWeight: 500,
                    }}
                  >
                    Upload
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                      textAlign: "center",
                      marginTop: "4px",
                    }}
                  >
                    Select a receipt image from your device
                  </Typography>
                </>
              )}
            </Box>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </Box>
        )}
      </Box>

      {validationError && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: "10px",
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? colors.redAccent[400] : colors.redAccent[600],
            }
          }}
        >
          {validationError}
        </Alert>
      )}

      {errorMessages.length > 0 && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: "10px",
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? colors.redAccent[400] : colors.redAccent[600],
            }
          }}
        >
          {errorMessages.join(". ")}
        </Alert>
      )}

      {isProcessing && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            borderRadius: "10px",
            '& .MuiAlert-icon': {
              color: theme.palette.mode === 'dark' ? colors.blueAccent[400] : colors.blueAccent[600],
            }
          }}
        >
          {isProcessing}
        </Alert>
      )}

      {tableData.length > 0 && (
        <Box
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.4)'
              : 'rgba(255, 255, 255, 0.4)',
            borderRadius: "12px",
            padding: { xs: "16px 12px", sm: "16px", md: "20px" },
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            height: "auto",
            width: "100%",
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.2)'
              : '0 4px 12px rgba(0, 0, 0, 0.05)',
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header section with title and action buttons */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              marginBottom: { xs: "12px", sm: "16px", md: "20px" },
              gap: { xs: "12px", sm: "0" },
              width: "100%",
              borderBottom: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)'}`,
              paddingBottom: { xs: "12px", sm: "16px" },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? colors.grey[200] : colors.grey[800],
                fontSize: { xs: "1rem", md: "1.1rem" },
                letterSpacing: "-0.01em",
              }}
            >
              Extracted Items
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: { xs: "8px", sm: "12px" },
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "space-between", sm: "flex-end" },
              }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddRow}
                sx={{
                  textTransform: "none",
                  borderRadius: "8px",
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                  padding: { xs: "6px 12px", md: "6px 16px" },
                  minWidth: { xs: "80px", sm: "100px" },
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                Add Row
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleConfirm}
                disabled={isProcessing != null}
                sx={{
                  textTransform: "none",
                  borderRadius: "8px",
                  backgroundColor: colors.primary[theme.palette.mode === 'dark' ? 500 : 600],
                  color: "#fff",
                  padding: { xs: "6px 12px", md: "6px 16px" },
                  minWidth: { xs: "90px", sm: "110px" },
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: colors.primary[theme.palette.mode === 'dark' ? 600 : 700],
                  },
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 10px rgba(0, 123, 255, 0.2)'
                    : '0 4px 10px rgba(0, 123, 255, 0.15)',
                }}
              >
                Confirm
              </Button>
            </Box>
          </Box>

          {/* Data grid container with improved styling */}
          <Box
            sx={{
              flex: 1,
              width: "100%",
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(20, 23, 39, 0.2)'
                : 'rgba(255, 255, 255, 0.2)',
              border: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.03)'}`,
            }}
          >
            <DataGrid
              sx={{
                height: { xs: "45vh", sm: "40vh", md: "35vh" },
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(20, 23, 39, 0.6)'
                    : 'rgba(240, 240, 240, 0.6)',
                  color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                  borderRadius: "0",
                  borderBottom: `1px solid ${theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)'}`,
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600,
                    fontSize: { xs: "0.85rem", md: "0.9rem" },
                  },
                  padding: "0 8px",
                },
                "& .MuiDataGrid-virtualScroller": {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(20, 23, 39, 0.3)'
                    : 'rgba(255, 255, 255, 0.3)',
                },
                "& .MuiDataGrid-row": {
                  borderRadius: "0",
                  borderBottom: `1px solid ${theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(0, 0, 0, 0.03)'}`,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(20, 23, 39, 0.6)'
                    : 'rgba(255, 255, 255, 0.6)',
                  "&:hover": {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(30, 33, 49, 0.8)'
                      : 'rgba(245, 245, 245, 0.8)',
                  }
                },
                "& .MuiDataGrid-cell": {
                  borderBottom: "none",
                  fontSize: { xs: "0.85rem", md: "0.9rem" },
                  padding: "0 8px",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: `1px solid ${theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)'}`,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(20, 23, 39, 0.6)'
                    : 'rgba(240, 240, 240, 0.3)',
                  padding: "4px 8px",
                },
                "& .MuiTablePagination-root": {
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                  fontSize: { xs: "0.8rem", md: "0.85rem" },
                },
                "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                },
                "& .MuiDataGrid-overlay": {
                  backgroundColor: "transparent",
                },
                "& .MuiCircularProgress-root": {
                  color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                },
              }}
              rows={tableData}
              columns={[
                {
                  field: "trp_name",
                  headerName: "Name",
                  flex: 1,
                  minWidth: 150,
                  editable: true,
                  headerAlign: "left",
                  align: "left",
                },
                {
                  field: "spend",
                  headerName: "Spend",
                  flex: 0.7,
                  minWidth: 100,
                  editable: true,
                  headerAlign: "right",
                  align: "right",
                  valueFormatter: (params) => {
                    if (params.value == null) return '';
                    return params.value.toLocaleString();
                  },
                },
                {
                  field: "create_date",
                  headerName: "Date",
                  flex: 0.8,
                  minWidth: 120,
                  editable: true,
                  headerAlign: "center",
                  align: "center",
                },
                {
                  field: "actions",
                  headerName: "Actions",
                  flex: 0.5,
                  minWidth: 80,
                  headerAlign: "center",
                  align: "center",
                  renderCell: (params) => (
                    <IconButton
                      onClick={() => handleRemoveRow(params.row.id)}
                      size="small"
                      sx={{
                        color: theme.palette.mode === 'dark' ? colors.redAccent[400] : colors.redAccent[600],
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 82, 82, 0.1)'
                            : 'rgba(255, 82, 82, 0.05)',
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  ),
                },
              ]}
              processRowUpdate={handleProcessRowUpdate}
              disableSelectionOnClick
              experimentalFeatures={{ newEditingApi: true }}
              pageSize={8}
              rowsPerPageOptions={[8]}
              disableColumnMenu
            />
          </Box>

          {/* Footer section with pagination info */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: { xs: "12px", sm: "16px" },
              paddingTop: { xs: "8px", sm: "8px" },
              borderTop: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)'}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                fontSize: { xs: "0.7rem", md: "0.75rem" },
              }}
            >
              {`Total items: ${tableData.length}`}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={cropperOpen}
        imageSrc={imageToCrop}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </Box>
  );
};

export default ReceiptScanner;
