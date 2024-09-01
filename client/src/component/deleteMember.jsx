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
import { useDeleteMemberMutation, useDeleteTripMutation } from "../api/api";
import CustomAlert from "../component/CustomAlert";

export default function DeleteMember({
  triggerMember,
  member,
  trips,
  triggerTrips,
  group_id,
}) {
  const theme = useTheme();

  const colors = tokens(theme.palette.mode);
  const [deleteTrip, setDeleteTrip] = useState(""); // New state for trip selection
  // State management
  const [deleteName, setDeleteName] = useState("");
  const [triggerDeleteMember, { isLoading, isSuccess, isError, error }] =
    useDeleteMemberMutation();
  const [triggerDeleteTrip, { isLoading: isDeletingTrip }] = useDeleteTripMutation();

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  // Handle change in member selection
  const handleChange = (event) => {
    setDeleteName(event.target.value);
  };

  const handleDelete = async () => {
    setAlertMessage(""); // Clear any previous messages
    setAlertOpen(false); // Close any previous alerts
    setAlertType("success"); // Reset alert type
    try {
      const results = await Promise.all([
        deleteName ? triggerDeleteMember(deleteName) : null,
        deleteTrip ? triggerDeleteTrip({ trip_id: deleteTrip, group_id }) : null,
      ]);

      const [memberResponse, tripResponse] = results;

      if (memberResponse?.data?.status) {
        setAlertMessage("Successfully deleted the member.");
        setAlertType("success");
        triggerMember({ group_id });

      } else if (deleteName) {
        setAlertMessage(memberResponse?.data?.message || "Failed to delete the member.");
        setAlertType("error");
      }

      if (tripResponse?.data?.status) {
        setAlertMessage(prev => `${prev}\nSuccessfully deleted the trip.`);
        setAlertType("success");
        triggerTrips({ group_id });
      } else if (deleteTrip) {
        setAlertMessage(prev => `${prev}\nFailed to delete the trip.`);
        setAlertType("error");
      }

      setAlertOpen(true);
    } catch (error) {
      setAlertMessage("An error occurred. Please try again.");
      setAlertType("error");
      setAlertOpen(true);
    } finally {
      setDeleteName(""); // Reset selections
      setDeleteTrip("");
    }
  };

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
        <FormControl variant="standard" sx={{ minWidth: "263px" }}>
          <InputLabel
            color="primary"
            sx={{
              color: colors.primary[500],
              "&.Mui-focused": {
                color: colors.primary[500],
              },
            }}
          >
            Pick a member
          </InputLabel>
          <Select
            value={deleteName}
            onChange={handleChange}
            label="Pick a member"
            color="primary"
            sx={{
              "& .MuiSelect-select": {
                color: colors.primary[600],
              },
              "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[400],
              },
              "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[500],
              },
              "& .MuiSelect-icon": {
                color: colors.primary[500],
              },
            }}
          >
            <MenuItem value="" sx={{ color: colors.primary[600] }}>
              {" "}
              {/* Add 'None' option */}
              None
            </MenuItem>
            {member?.map((item) => (
              <MenuItem
                key={item.id}
                value={item.id}
                sx={{
                  backgroundColor:
                    deleteName === item.id ? colors.primary[500] : "inherit",
                  color: deleteName === item.id ? "#fff" : colors.primary[600],
                  "&:hover": {
                    backgroundColor: colors.primary[400],
                    color: "#fff",
                  },
                  "&.Mui-selected": {
                    backgroundColor: colors.primary[400],
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: colors.primary[500],
                      color: "#fff",
                    },
                  },
                }}
              >
                {item.mem_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="standard" sx={{ minWidth: "263px", mt: 2 }}>
          <InputLabel
            color="primary"
            sx={{
              color: colors.primary[500],
              "&.Mui-focused": {
                color: colors.primary[500],
              },
            }}
          >
            Pick a Trip
          </InputLabel>
          <Select
            value={deleteTrip}
            onChange={(event) => setDeleteTrip(event.target.value)}
            label="Pick a Trip"
            color="primary"
            sx={{
              "& .MuiSelect-select": {
                color: colors.primary[600],
              },
              "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[400],
              },
              "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[500],
              },
              "& .MuiSelect-icon": {
                color: colors.primary[500],
              },
            }}
          >
            <MenuItem value="" sx={{ color: colors.primary[600] }}>
              {" "}
              {/* Add 'None' option */}
              None
            </MenuItem>
            {trips?.map((trip) => (
              <MenuItem
                key={trip.id}
                value={trip.id}
                sx={{
                  backgroundColor:
                    deleteTrip === trip.id ? colors.primary[500] : "inherit",
                  color: deleteTrip === trip.id ? "#fff" : colors.primary[600],
                  "&:hover": {
                    backgroundColor: colors.primary[400],
                    color: "#fff",
                  },
                  "&.Mui-selected": {
                    backgroundColor: colors.primary[400],
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: colors.primary[500],
                      color: "#fff",
                    },
                  },
                }}
              >
                {trip.trp_name} {/* Updated to correct key */}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          sx={{
            gridColumn: "span 4",
            backgroundColor: colors.primary[500],
            color: "#fff",
          }}
          onClick={handleDelete}
          type="button"
          color="error"
          variant="contained"
          startIcon={
            (isLoading || isDeletingTrip) ? <CircularProgress size="1rem" /> : <DeleteIcon />
          }
          disabled={isLoading || (!deleteName && !deleteTrip)} // Updated condition
        >
          {isLoading ? "Deleting..." : "Delete"}
        </Button>
      </Box>
      <Box mt={2} sx={{ color: colors.primary[600] }}>
        {deleteName &&
          !deleteTrip &&
          `Selected Member: ${member.find((m) => m.id === deleteName)?.mem_name
          } will be deleted.`}
        {deleteTrip &&
          !deleteName &&
          `Selected Trip: ${trips.find((t) => t.id === deleteTrip)?.trp_name
          } will be deleted.`}{" "}
        {/* Updated here */}
        {deleteName &&
          deleteTrip &&
          `Selected Member: ${member.find((m) => m.id === deleteName)?.mem_name
          } and Trip: ${trips.find((t) => t.id === deleteTrip)?.trp_name
          } will be deleted.`}{" "}
        {/* Updated here */}
        {!deleteName && !deleteTrip && "No member or trip is selected."}
      </Box>
      <CustomAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </React.Fragment>
  );
}
