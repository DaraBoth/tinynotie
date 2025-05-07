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
  Typography,
  alpha,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { tokens } from "../theme";
import { useDeleteMemberMutation, useDeleteTripMutation } from "../api/api";
import CustomAlert from "../component/CustomAlert";
import { motion } from "framer-motion";

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
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 59, 59, 0.15)'
                  : 'rgba(255, 59, 59, 0.1)',
                borderRadius: "12px",
                padding: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 1.5
              }}
            >
              <PersonRemoveIcon
                sx={{
                  color: colors.redAccent[theme.palette.mode === 'dark' ? 400 : 600],
                  fontSize: { xs: "1.2rem", md: "1.3rem" }
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                fontSize: { xs: "1rem", md: "1.1rem" },
                fontWeight: 600,
                letterSpacing: "-0.01em"
              }}
            >
              Select Member to Delete
            </Typography>
          </Box>

          <FormControl
            variant="outlined"
            fullWidth
            sx={{
              minWidth: "100%",
            }}
          >
            <InputLabel
              id="member-select-label"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                '&.Mui-focused': {
                  color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                },
              }}
            >
              Select Member
            </InputLabel>
            <Select
              labelId="member-select-label"
              value={deleteName}
              onChange={handleChange}
              label="Select Member"
              color="primary"
              sx={{
                borderRadius: "10px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.15)',
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.25)'
                    : 'rgba(0, 0, 0, 0.25)',
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                },
                "& .MuiSelect-select": {
                  color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                  padding: "12px 14px",
                },
                "& .MuiSelect-icon": {
                  color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(20, 23, 39, 0.9)'
                      : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: "blur(10px)",
                    borderRadius: "10px",
                    border: `1px solid ${theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)'}`,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                      : '0 8px 16px rgba(0, 0, 0, 0.1)',
                  }
                }
              }}
            >
              <MenuItem value="" sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                borderRadius: "6px",
                margin: "4px",
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)',
                }
              }}>
                None
              </MenuItem>
              {member?.map((item) => (
                <MenuItem
                  key={item.id}
                  value={item.id}
                  sx={{
                    color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                    borderRadius: "6px",
                    margin: "4px",
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? alpha(colors.primary[600], 0.2)
                        : alpha(colors.primary[600], 0.1),
                      color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? alpha(colors.primary[600], 0.3)
                          : alpha(colors.primary[600], 0.2),
                      }
                    }
                  }}
                >
                  {item.mem_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 59, 59, 0.15)'
                  : 'rgba(255, 59, 59, 0.1)',
                borderRadius: "12px",
                padding: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 1.5
              }}
            >
              <EventBusyIcon
                sx={{
                  color: colors.redAccent[theme.palette.mode === 'dark' ? 400 : 600],
                  fontSize: { xs: "1.2rem", md: "1.3rem" }
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                fontSize: { xs: "1rem", md: "1.1rem" },
                fontWeight: 600,
                letterSpacing: "-0.01em"
              }}
            >
              Select Trip to Delete
            </Typography>
          </Box>

          <FormControl
            variant="outlined"
            fullWidth
            sx={{
              minWidth: "100%",
            }}
          >
            <InputLabel
              id="trip-select-label"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                '&.Mui-focused': {
                  color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                },
              }}
            >
              Select Trip
            </InputLabel>
            <Select
              labelId="trip-select-label"
              value={deleteTrip}
              onChange={(event) => setDeleteTrip(event.target.value)}
              label="Select Trip"
              color="primary"
              sx={{
                borderRadius: "10px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.15)',
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.25)'
                    : 'rgba(0, 0, 0, 0.25)',
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                },
                "& .MuiSelect-select": {
                  color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                  padding: "12px 14px",
                },
                "& .MuiSelect-icon": {
                  color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(20, 23, 39, 0.9)'
                      : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: "blur(10px)",
                    borderRadius: "10px",
                    border: `1px solid ${theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)'}`,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                      : '0 8px 16px rgba(0, 0, 0, 0.1)',
                  }
                }
              }}
            >
              <MenuItem value="" sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                borderRadius: "6px",
                margin: "4px",
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)',
                }
              }}>
                None
              </MenuItem>
              {trips?.map((trip) => (
                <MenuItem
                  key={trip.id}
                  value={trip.id}
                  sx={{
                    color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                    borderRadius: "6px",
                    margin: "4px",
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? alpha(colors.primary[600], 0.2)
                        : alpha(colors.primary[600], 0.1),
                      color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? alpha(colors.primary[600], 0.3)
                          : alpha(colors.primary[600], 0.2),
                      }
                    }
                  }}
                >
                  {trip.trp_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {(deleteName || deleteTrip) && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            sx={{
              mt: 1,
              p: 2,
              borderRadius: "10px",
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(colors.redAccent[700], 0.15)
                : alpha(colors.redAccent[100], 0.3),
              border: `1px solid ${theme.palette.mode === 'dark'
                ? alpha(colors.redAccent[700], 0.3)
                : alpha(colors.redAccent[300], 0.3)}`,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[200] : colors.grey[800],
                fontSize: { xs: "0.85rem", md: "0.9rem" },
                fontWeight: 500,
                mb: 1,
              }}
            >
              You are about to delete:
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {deleteName && (
                <Chip
                  label={`Member: ${member.find((m) => m.id === deleteName)?.mem_name}`}
                  color="error"
                  variant="outlined"
                  icon={<PersonRemoveIcon />}
                  sx={{
                    borderRadius: "8px",
                    fontWeight: 500,
                    fontSize: "0.8rem",
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(colors.redAccent[700], 0.2)
                      : alpha(colors.redAccent[100], 0.4),
                  }}
                />
              )}

              {deleteTrip && (
                <Chip
                  label={`Trip: ${trips.find((t) => t.id === deleteTrip)?.trp_name}`}
                  color="error"
                  variant="outlined"
                  icon={<EventBusyIcon />}
                  sx={{
                    borderRadius: "8px",
                    fontWeight: 500,
                    fontSize: "0.8rem",
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(colors.redAccent[700], 0.2)
                      : alpha(colors.redAccent[100], 0.4),
                  }}
                />
              )}
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: colors.redAccent[theme.palette.mode === 'dark' ? 400 : 600],
                fontSize: { xs: "0.8rem", md: "0.85rem" },
                fontWeight: 500,
                mt: 1,
              }}
            >
              This action cannot be undone.
            </Typography>
          </Box>
        )}

        <Button
          onClick={handleDelete}
          type="button"
          variant="contained"
          color="error"
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading || isDeletingTrip || (!deleteName && !deleteTrip)}
          startIcon={(isLoading || isDeletingTrip) ? <CircularProgress size="1rem" color="inherit" /> : <DeleteIcon />}
          sx={{
            backgroundColor: colors.redAccent[theme.palette.mode === 'dark' ? 500 : 600],
            color: "#fff",
            "&:hover": {
              backgroundColor: colors.redAccent[theme.palette.mode === 'dark' ? 600 : 700],
            },
            textTransform: "none",
            fontWeight: "500",
            fontSize: { xs: "0.85rem", md: "0.95rem" },
            padding: { xs: "10px 16px", md: "12px 20px" },
            borderRadius: "8px",
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 10px rgba(255, 59, 59, 0.2)'
              : '0 4px 10px rgba(255, 59, 59, 0.15)',
            alignSelf: "flex-end",
            mt: 1,
          }}
        >
          {(isLoading || isDeletingTrip) ? "Deleting..." : "Delete Selected Items"}
        </Button>
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
