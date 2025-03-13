import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useMediaQuery,
  CircularProgress,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useGetAllMemberMutation, usePostAddGroupMutation } from "../api/api";
import moment from "moment";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import cooking from "../assets/cooking.json";
import CustomSnackbar from "../component/CustomSnackbar";
import Lottie from "lottie-react";

export default function CreateGroup({ secret, setGroupInfo }) {
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(5); // Countdown in seconds
  const [abortController, setAbortController] = useState(null);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [triggerMember, resultMember] = useGetAllMemberMutation();
  const [triggerCreateGroup, resultGroup] = usePostAddGroupMutation();
  const [suggestMember, setSuggestMember] = useState([]);
  const [newMember, setNewMember] = useState([]);
  const [currency, setCurrency] = useState("$");
  const [showSnackbar, setShowSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    triggerMember();
  }, []);

  useEffect(() => {
    if (resultMember.data?.status) {
      setSuggestMember(resultMember.data.data);
    }
  }, [resultMember.data]);

  const handleFormSubmit = debounce(async (values) => {
    const { grp_name } = values;
    if (grp_name && currency && newMember.length > 0) {
      const controller = new AbortController(); // Create AbortController
      setAbortController(controller);
      setShowUndoSnackbar(true); // Show undo Snackbar
      setUndoCountdown(5); // Start countdown from 5 seconds

      const countdownInterval = setInterval(() => {
        setUndoCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowUndoSnackbar(false); // Hide Snackbar when countdown ends
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      try {
        await triggerCreateGroup(
          {
            user_id: secret,
            grp_name,
            currency,
            status: 1,
            create_date: moment().format("YYYY-MM-DD HH:mm:ss"),
            member: JSON.stringify(newMember),
          },
          { signal: controller.signal }
        ).unwrap();

        setShowSnackbar({
          open: true,
          message: "Note created successfully!",
          severity: "success",
        });
        setTimeout(() => navigate("/"), 2000);
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Request aborted");
        } else {
          setShowSnackbar({
            open: true,
            message: "Something went wrong. Please try again.",
            severity: "error",
          });
        }
      }
    }
  }, 500);

  const handleCancelClick = (values) => {
    // Check if any input is filled or any members are added
    if (values.grp_name || newMember.length > 0) {
      setShowConfirmCancel(true);
    } else {
      navigate("/");
    }
  };

  const handleConfirmCancel = () => {
    setShowConfirmCancel(false);
    navigate("/");
  };

  const handleUndo = () => {
    if (abortController) {
      abortController.abort(); // Abort the request
      setAbortController(null); // Reset controller
    }
    setShowUndoSnackbar(false); // Hide the Snackbar
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.primary[900], // Background color
        padding: isNonMobile ? "40px" : "20px", // Adjusted padding
      }}
    >
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={checkoutSchema}
      >
        {({
          values,
          handleChange,
          handleSubmit,
          errors,
          touched,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                width: isNonMobile ? "650px" : "100%", // Full width on mobile
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                padding: "32px", // Added padding
                backgroundColor: colors.grey[800], // Form background color
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)", // Added shadow for better visual
                position: "relative",
              }}
            >
              {isSubmitting && (
                <Box
                  sx={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    marginLeft: "-32px",
                    marginTop: "-32px",
                    backgroundColor: "blanchedalmond",
                    borderRadius: "12px",
                    zIndex: "200",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mixBlendMode: "screen",
                    transition: "ease-in",
                  }}
                >
                  <Lottie
                    animationData={cooking}
                    loop={true}
                    style={{
                      width: 500,
                      height: 500,
                      mixBlendMode: "multiply",
                    }}
                  />
                </Box>
              )}
              <Typography
                variant="h4"
                textAlign="center"
                color={colors.primary[100]} // Text color based on theme
              >
                Create New Note
              </Typography>
              <TextField
                variant="outlined"
                label="Note's name"
                onChange={handleChange}
                value={values.grp_name}
                name="grp_name"
                color="primary"
                error={Boolean(touched.grp_name && errors.grp_name)}
                helperText={touched.grp_name && errors.grp_name}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: colors.primary[300] }}>🏷️</Box>
                  ),
                  style: {
                    color: colors.primary[100], // Text color for input
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: colors.primary[500],
                    },
                    "&:hover fieldset": {
                      borderColor: colors.primary[300],
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: colors.primary[100],
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: colors.primary[500], // Label color
                  },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 1000px ${colors.grey[800]} inset !important`,
                    WebkitTextFillColor: `${colors.primary[100]} !important`,
                  },
                }}
              />
              <FormControl variant="outlined" fullWidth>
                <InputLabel sx={{ color: colors.primary[500] }}>
                  Currency
                </InputLabel>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  label="Currency"
                  sx={{
                    backgroundColor: colors.grey[800], // Ensure select has the correct background
                    color: colors.primary[100],
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: colors.primary[500],
                      },
                      "&:hover fieldset": {
                        borderColor: colors.primary[300],
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: colors.primary[100],
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: colors.primary[500],
                    },
                    "& .MuiSelect-icon": {
                      color: colors.primary[100], // Ensure dropdown arrow matches theme
                    },
                  }}
                >
                  <MenuItem value="$">US Dollar</MenuItem>
                  <MenuItem value="W">Korean Won</MenuItem>
                  <MenuItem value="R">Khmer Reil</MenuItem>
                </Select>
              </FormControl>
              <Autocomplete
                multiple
                id="tags-filled"
                options={suggestMember.map((option) => option.mem_name)}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="filled"
                      label={option}
                      {...getTagProps({ index })}
                      sx={{
                        backgroundColor: colors.primary[500],
                        color: colors.primary[100],
                      }}
                    />
                  ))
                }
                value={values.members} // Set value from Formik
                onChange={(event, newValue) => {
                  setNewMember(newValue);
                  handleChange({
                    target: { name: "members", value: newValue },
                  }); // Handle change for Formik
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Add Members"
                    color="primary"
                    placeholder="Enter member names"
                    fullWidth
                    error={Boolean(touched.members && errors.members)}
                    helperText={touched.members && errors.members} // Show validation error
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <Box sx={{ mr: 1, color: colors.primary[300] }}>
                            👥
                          </Box>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      style: {
                        color: colors.primary[100], // Text color for input
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: colors.primary[500],
                        },
                        "&:hover fieldset": {
                          borderColor: colors.primary[300],
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: colors.primary[100],
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: colors.primary[500],
                      },
                    }}
                  />
                )}
              />

              <Typography
                variant="body2"
                sx={{
                  color: colors.primary[300],
                  textAlign: "center",
                  mt: -2,
                }}
              >
                Tip: Type a name and press Enter to add it to the list.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleCancelClick(values)}
                  sx={{
                    height: "45px",
                    borderColor: colors.grey[500], // Adjust border color to match theme
                    color: colors.grey[500], // Adjust text color to match theme
                    borderRadius: "8px", // Slightly more rounded corners
                    transition: "background-color 0.3s ease, color 0.3s ease",
                    "&:hover": {
                      backgroundColor: colors.redAccent[500], // Background color on hover
                      color: colors.primary[100], // Text color on hover
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  fullWidth
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? <CircularProgress size="1rem" /> : null
                  }
                  sx={{
                    height: "45px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                    transition: "background-color 0.3s ease",
                    color: colors.primary[900], // Text color for submit button
                    "&:hover": {
                      backgroundColor: colors.primary[700], // Adjust hover color for submit button
                    },
                  }}
                >
                  {isSubmitting ? "Creating..." : "Create Note"}
                </Button>
              </Box>
            </Box>
          </form>
        )}
      </Formik>
      <Dialog
        open={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        PaperProps={{
          sx: {
            backgroundColor: colors.grey[800], // Dialog background color to match theme
            color: colors.primary[100], // Dialog text color to match theme
          },
        }}
      >
        <DialogTitle>Confirm Cancel</DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: colors.primary[300], // Dialog content text color to match theme
            }}
          >
            You have unsaved changes. Are you sure you want to cancel?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmCancel(false)}
            sx={{ color: colors.primary[300] }}
          >
            No, go back
          </Button>
          <Button
            onClick={handleConfirmCancel}
            sx={{ color: colors.redAccent[500] }}
            autoFocus
          >
            Yes, cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Centralized Snackbar */}
      <Snackbar
        open={showUndoSnackbar}
        autoHideDuration={5000}
        message={`Creating... Click "Undo" within ${undoCountdown} seconds to cancel.`}
        action={
          <Button color="secondary" size="small" onClick={handleUndo}>
            Undo
          </Button>
        }
      />
    </Box>
  );
}

const checkoutSchema = yup.object().shape({
  grp_name: yup.string().required("Note name is required"),
  members: yup
    .array()
    .min(1, "At least one member must be selected")
    .required(),
});

const initialValues = {
  grp_name: "",
  members: [],
};

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}
