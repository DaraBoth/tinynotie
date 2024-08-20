import React, { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { tokens } from "../theme";
import { useDeleteMemberMutation } from "../api/api";
import CustomAlert from "../component/CustomAlert";

export default function DeleteMember({ triggerMember, member, group_id }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // State management
  const [deleteName, setDeleteName] = useState("");
  const [triggerDeleteMember, { isLoading, isSuccess, isError, error }] = useDeleteMemberMutation();
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  // Handle change in member selection
  const handleChange = (event) => {
    setDeleteName(event.target.value);
  };

  // Handle delete member action
  const handleDelete = () => {
    if (deleteName) {
      triggerDeleteMember(deleteName)
        .then((response) => {
          if (response?.data?.status) {
            setAlertMessage("Successfully deleted the member.");
            setAlertType("success");
            triggerMember({ group_id });
          } else {
            setAlertMessage(response?.data?.message || "Failed to delete the member.");
            setAlertType("error");
          }
          setAlertOpen(true);
        })
        .catch(() => {
          setAlertMessage("An error occurred. Please try again.");
          setAlertType("error");
          setAlertOpen(true);
        })
        .finally(() => {
          setDeleteName(""); // Reset member selection
        });
    }
  };

  useEffect(() => {
    if (isError) {
      setAlertMessage(error?.data?.message || "Failed to delete the member.");
      setAlertType("error");
      setAlertOpen(true);
    }
    if (isSuccess) {
      setAlertMessage("Successfully deleted the member.");
      setAlertType("success");
      setAlertOpen(true);
      triggerMember({ group_id });
    }
  }, [isError, isSuccess, error, triggerMember, group_id]);

  return (
    <React.Fragment>
      <Box
        display="grid"
        gap="20px"
        gridTemplateColumns="repeat(4, 1fr)"
        sx={{
          marginTop: "5px",
          "& > div": { gridColumn: "span 4" },
        }}
      >
        <FormControl variant="standard">
          <InputLabel color="primary">Pick a member</InputLabel>
          <Select
            value={deleteName}
            onChange={handleChange}
            label="Pick a member"
            color="primary"
            sx={{ minWidth: "300px" }}
          >
            {member?.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.mem_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          sx={{ gridColumn: "span 4" }}
          onClick={handleDelete}
          type="button"
          color="error"
          variant="contained"
          startIcon={isLoading ? <CircularProgress size="1rem" /> : <DeleteIcon />}
          disabled={isLoading || !deleteName}
        >
          {isLoading ? "Deleting..." : "Delete Member"}
        </Button>
      </Box>

      {/* Custom Alert for feedback */}
      <CustomAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </React.Fragment>
  );
}
