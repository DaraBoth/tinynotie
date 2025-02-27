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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Paper from "@mui/material/Paper";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import NoPhotographyRoundedIcon from "@mui/icons-material/NoPhotographyRounded";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete"; // Added for delete functionality
import Tesseract from "tesseract.js";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import {
  usePostAddMultipleTripsMutation,
  useReceiptTextMutation,
} from "../api/api";

const StickyIconButton = styled(IconButton)({
  position: "absolute",
  top: 5,
  right: 5,
  zIndex: 1,
});

const ReceiptScanner = ({
  triggerMember,
  triggerTrips,
  member,
  trips,
  group_id,
}) => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [tableData, setTableData] = useState([]);
  const [isProcessing, setIsProcessing] = useState("No image uploaded yet");
  const [validationError, setValidationError] = useState(null);
  const [imageStatus, setImageStatus] = useState(null);
  const [triggerReceptText, resultReceptText] = useReceiptTextMutation();
  const [triggerAddMultipleTrips, resultAddMultipleTrips] =
    usePostAddMultipleTripsMutation();
  const [showCameraAndUpload, setShowCameraAndUpload] = useState(true);
  const [accordionExpanded, setAccordionExpanded] = useState(true); // Default open
  const [errorMessages, setErrorMessages] = useState([]); // For failed trip submissions

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: "#fff",
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
    // Handle result from Tesseract OCR
    if (resultReceptText.isSuccess && resultReceptText.data) {
      let responseText = resultReceptText.data.text;

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

        // Parse OCR results
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

        setImageStatus(null);
        resetImageInput();
      } catch (e) {
        setIsProcessing("Error parsing JSON");
        console.error("Error parsing JSON:", e);
      }
    } else if (resultReceptText.isError) {
      setIsProcessing("Error processing image.");
      resetImageInput();
    }
  }, [resultReceptText]);

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
    setIsProcessing("No image uploaded yet");
    setTableData([]);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageStatus(file.name);
      setIsProcessing("Processing image...");

      try {
        const {
          data: { text },
        } = await Tesseract.recognize(file, "kor", {});
        triggerReceptText({ text });
        setIsProcessing("AI analyzing image...");
      } catch (error) {
        console.error("Error extracting text:", error);
        setIsProcessing("Error extracting text.");
      }
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

  const handleAccordionChange = (event, isExpanded) => {
    setAccordionExpanded(isExpanded);
  };

  return (
    <Box>
      <Accordion
        sx={{ background: "transparent", boxShadow: "none" }}
        expanded={accordionExpanded}
        onChange={handleAccordionChange}
      >
        <AccordionSummary
          aria-controls="panel1a-content"
          id="panel1a-header"
          sx={{ padding: 0, minHeight: 0 }}
        >
          <IconButton
            sx={{
              position: "absolute",
              top: 0,
              right: "calc(100% / 2 - 20px)",
              zIndex: 1,
            }}
          >
            {!accordionExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </AccordionSummary>

        <AccordionDetails>
          {showCameraAndUpload && (
            <Box
              sx={{
                display: "flex",
                flexDirection: isNonMobile ? "row" : "column",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Item>
                <StickyIconButton color="primary" onClick={handleCameraClick}>
                  <PhotoCameraIcon />
                </StickyIconButton>
                <Typography variant="h6">Camera</Typography>
              </Item>

              <Item>
                <StickyIconButton color="primary" onClick={handleUploadClick}>
                  <UploadIcon />
                </StickyIconButton>
                {imageStatus ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2">{imageStatus}</Typography>
                    <IconButton color="error" onClick={handleRemoveImage}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Typography variant="h6">Upload</Typography>
                )}
              </Item>

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
        </AccordionDetails>
      </Accordion>

      {validationError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {validationError}
        </Alert>
      )}

      {errorMessages.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessages.join(". ")}
        </Alert>
      )}

      <Box
        sx={{
          padding: "10px",
          borderRadius: "4px",
          minHeight: "100px",
        }}
      >
        {isProcessing && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {isProcessing}
          </Alert>
        )}

        {tableData.length > 0 && (
          <Box sx={{ height: 400, width: "100%", marginTop: "20px" }}>
            <DataGrid
              sx={{
                minHeight: "63vh",
              }}
              rows={tableData}
              columns={[
                {
                  field: "trp_name",
                  headerName: "Name",
                  width: 200,
                  editable: true,
                },
                {
                  field: "spend",
                  headerName: "Spend",
                  width: 150,
                  editable: true,
                },
                {
                  field: "create_date",
                  headerName: "Create Date",
                  width: 150,
                  editable: true,
                },
                {
                  field: "actions", // Column for removing a row
                  headerName: "Actions",
                  width: 100,
                  renderCell: (params) => (
                    <IconButton
                      onClick={() => handleRemoveRow(params.row.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  ),
                },
              ]}
              processRowUpdate={handleProcessRowUpdate}
              disableSelectionOnClick
              experimentalFeatures={{ newEditingApi: true }}
              pageSize={8}
              rowsPerPageOptions={[8]}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "10px",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddRow}
                sx={{ marginRight: "10px" }}
              >
                Add Row
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleConfirm}
                disabled={isProcessing != null}
              >
                Confirm
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ReceiptScanner;
