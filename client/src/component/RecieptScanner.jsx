import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import UploadIcon from "@mui/icons-material/Upload";
import NoPhotographyRoundedIcon from "@mui/icons-material/NoPhotographyRounded";
import Tesseract from "tesseract.js";
import { DataGrid } from "@mui/x-data-grid"; // MUI DataGrid
import { useReceiptTextMutation } from "../api/api";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  height: "280px",
}));

const ReceiptScanner = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [extractedText, setExtractedText] = useState(""); // State to hold extracted text
  const [tableData, setTableData] = useState([]); // State to hold parsed table data
  const [isProcessing, setIsProcessing] = useState(false); // State to track processing
  const [triggerReceptText, resultReceptText] = useReceiptTextMutation();

  useEffect(() => {
    if (resultReceptText.isSuccess && resultReceptText.data) {
      let responseText = resultReceptText.data.text;

      try {
        // Check if response text looks like an escaped JSON string
        if (typeof responseText === "string" && responseText.includes("json")) {
          // Clean the escaped string by removing escape sequences
          responseText = responseText.replace("```json", "").replace("```", "");
        }

        // Attempt to parse the cleaned response
        const parsedData = JSON.parse(responseText);

        if (parsedData && Array.isArray(parsedData.data)) {
          setTableData(parsedData.data); // Set table data if it's an array
        } else {
          setExtractedText("Parsed data is not an array.");
        }
      } catch (e) {
        console.error("Error parsing JSON:", e);
        setExtractedText("Failed to parse JSON data.");
      }
      setIsProcessing(false);
    }
  }, [resultReceptText]);

  // Function to trigger camera input
  const handleCameraClick = () => {
    if (isNonMobile) return;
    cameraInputRef.current.click();
  };

  // Function to trigger upload input
  const handleUploadClick = () => {
    uploadInputRef.current.click();
  };

  // Handle file change for both camera and upload
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsProcessing(true);

      // Extract text using Tesseract.js
      try {
        const {
          data: { text },
        } = await Tesseract.recognize(file, "kor", {});
        triggerReceptText({ text });
      } catch (error) {
        console.error("Error extracting text:", error);
        setExtractedText("Failed to extract text.");
      }
    }
  };

  // Process row update and update the state to keep changes persistent
  const processRowUpdate = (newRow) => {
    const updatedRows = tableData.map((row) =>
      row.id === newRow.id ? newRow : row
    );
    setTableData(updatedRows); // Update the tableData with the new edited row
    return newRow;
  };

  // Define columns for the DataGrid (excluding mem_id)
  const columns = [
    { field: "trp_name", headerName: "Name", width: 200, editable: true },
    { field: "spend", headerName: "Spend", width: 150, editable: true },
    // { field: "create_date", headerName: "Create Date", width: 150, editable: true },
    // No mem_id column here
  ];

  return (
    <Box>
      {/* Open camera and upload buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* Camera section */}
        <Item onClick={handleCameraClick} style={{ cursor: "pointer" }}>
          <Typography variant="h6">Camera</Typography>
          {isNonMobile ? (
            <NoPhotographyRoundedIcon fontSize="large" />
          ) : (
            <PhotoCameraIcon fontSize="large" />
          )}
        </Item>

        {/* Upload section */}
        <Item onClick={handleUploadClick} style={{ cursor: "pointer" }}>
          <Typography variant="h6">Upload</Typography>
          <UploadIcon fontSize="large" />
        </Item>

        {/* Hidden inputs for file upload and camera */}
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

      {/* Detail Box - Display extracted text */}
      <Box
        sx={{
          padding: "10px",
          marginTop: "20px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          minHeight: "100px",
        }}
      >
        {isProcessing ? (
          <Typography variant="h6">Processing image...</Typography>
        ) : extractedText ? (
          <Typography variant="h6">Detail from Image:</Typography>
        ) : (
          <Typography variant="h6">No image uploaded yet</Typography>
        )}
        <Typography variant="body1">{extractedText}</Typography>
      </Box>

      {/* Editable DataGrid Table */}
      {tableData.length > 0 && (
        <Box sx={{ height: 400, width: "100%", marginTop: "20px" }}>
          <Typography variant="h6" gutterBottom>
            Parsed Data (Editable)
          </Typography>
          <DataGrid
            rows={tableData.map((row, index) => ({ id: index + 1, ...row }))} // Add id for DataGrid
            columns={columns}
            pageSize={5}
            processRowUpdate={processRowUpdate} // Handle row update for persistent edit
            checkboxSelection
            disableSelectionOnClick
            experimentalFeatures={{ newEditingApi: true }} // Use new MUI editing API
          />
        </Box>
      )}
    </Box>
  );
};

export default ReceiptScanner;
