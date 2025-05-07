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
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip,
  IconButton,
  Zoom,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useGetAllMemberMutation, usePostAddGroupMutation } from "../api/api";
import moment from "moment";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import CustomSnackbar from "../component/CustomSnackbar";
import SpaceSkyNew from "../component/SpaceSkyNew";
import { motion } from "framer-motion";
import GroupsIcon from '@mui/icons-material/Groups';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function CreateGroup({ secret, setGroupInfo }) {
  // State for snackbar and dialog
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

  const handleFormSubmit = async (values) => {
    const { grp_name } = values;
    if (grp_name && currency && newMember.length > 0) {
      try {
        // Create the group without using AbortController
        const response = await triggerCreateGroup({
          user_id: secret,
          grp_name,
          currency,
          status: 1,
          create_date: moment().format("YYYY-MM-DD HH:mm:ss"),
          member: JSON.stringify(newMember),
        });

        if (response.data && response.data.status) {
          setShowSnackbar({
            open: true,
            message: "Note created successfully!",
            severity: "success",
          });

          // Use a shorter timeout to navigate
          setTimeout(() => {
            navigate("/");
          }, 1000);
        } else {
          // Handle API error response
          setShowSnackbar({
            open: true,
            message: response.data?.message || "Failed to create note. Please try again.",
            severity: "error",
          });
        }
      } catch (error) {
        console.error("Error creating group:", error);
        setShowSnackbar({
          open: true,
          message: "Something went wrong. Please try again.",
          severity: "error",
        });
      }
    }
  };

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

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setShowSnackbar({
      ...showSnackbar,
      open: false
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "transparent",
        position: "relative",
      }}
    >
      {/* Background */}
      <SpaceSkyNew />

      {/* Header with back button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: { xs: "16px", md: "24px" },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Tooltip title="Go back">
          <IconButton
            onClick={() => handleCancelClick({ grp_name: "" })}
            sx={{
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(20, 23, 39, 0.7)'
                : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 4px 12px rgba(0, 0, 0, 0.1)',
              color: theme.palette.mode === 'dark' ? '#fff' : '#333',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(20, 23, 39, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography
          variant="h4"
          sx={{
            ml: 2,
            color: theme.palette.mode === 'dark' ? '#fff' : '#333',
            fontWeight: 600,
            textShadow: theme.palette.mode === 'dark'
              ? '0 2px 4px rgba(0, 0, 0, 0.5)'
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          Create New Note
        </Typography>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          padding: { xs: "0 16px 24px", md: "0 24px 32px" },
          gap: { xs: 3, md: 4 },
          alignItems: { xs: "center", md: "flex-start" },
          justifyContent: "center",
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
            <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: isNonMobile ? "500px" : "100%" }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  sx={{
                    width: "100%",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                    padding: "32px",
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(20, 23, 39, 0.9)'
                      : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                      : '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)'}`,
                    position: "relative",
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(40, 43, 59, 0.2) 0%, rgba(20, 23, 39, 0.2) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(240, 240, 240, 0.2) 100%)',
                      zIndex: -1,
                      borderRadius: "16px",
                    },
                  }}
            >
              {isSubmitting && (
                <Box
                  sx={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    left: 0,
                    top: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    borderRadius: "12px",
                    zIndex: "200",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CircularProgress color="primary" size={60} />
                </Box>
              )}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <NoteAddIcon
                    sx={{
                      fontSize: { xs: '2rem', md: '2.2rem' },
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(66, 66, 255, 0.8)'
                        : 'rgba(66, 66, 255, 0.9)',
                      mr: 1.5,
                    }}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                      fontSize: { xs: '1.5rem', md: '1.8rem' },
                      fontWeight: 600,
                    }}
                  >
                    Note Details
                  </Typography>
                </Box>
                <TextField
                  variant="outlined"
                  label="Note's name"
                  onChange={handleChange}
                  value={values.grp_name}
                  name="grp_name"
                  error={Boolean(touched.grp_name && errors.grp_name)}
                  helperText={touched.grp_name && errors.grp_name}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>🏷️</Box>
                    ),
                  }}
                  sx={{
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(0, 0, 0, 0.1)'
                        : 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '10px',
                      "& fieldset": {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.1)',
                      },
                      "&:hover fieldset": {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(0, 0, 0, 0.2)',
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(66, 66, 255, 0.6)'
                          : 'rgba(66, 66, 255, 0.4)',
                      },
                      "& input": {
                        color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                        padding: '14px 14px',
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(0, 0, 0, 0.6)',
                      "&.Mui-focused": {
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(66, 66, 255, 0.8)'
                          : 'rgba(66, 66, 255, 0.6)',
                      },
                    },
                    "& .MuiFormHelperText-root": {
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(255, 100, 100, 0.8)'
                        : 'rgba(211, 47, 47, 0.8)',
                      marginLeft: '4px',
                    },
                    "& input:-webkit-autofill": {
                      WebkitBoxShadow: theme.palette.mode === 'dark'
                        ? '0 0 0 1000px rgba(0, 0, 0, 0.2) inset !important'
                        : '0 0 0 1000px rgba(255, 255, 255, 0.8) inset !important',
                      WebkitTextFillColor: theme.palette.mode === 'dark' ? '#fff !important' : '#333 !important',
                    },
                  }}
                />
                <FormControl variant="outlined" fullWidth sx={{ mb: 1 }}>
                  <InputLabel sx={{
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(0, 0, 0, 0.6)',
                  }}>
                    Currency
                  </InputLabel>
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    label="Currency"
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(0, 0, 0, 0.1)'
                        : 'rgba(255, 255, 255, 0.7)',
                      color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                      borderRadius: '10px',
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.1)',
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(0, 0, 0, 0.2)',
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(66, 66, 255, 0.6)'
                          : 'rgba(66, 66, 255, 0.4)',
                      },
                      "& .MuiSelect-select": {
                        padding: '14px 14px',
                      },
                      "& .MuiSelect-icon": {
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.7)'
                          : 'rgba(0, 0, 0, 0.6)',
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(30, 33, 49, 0.95)'
                            : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '10px',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                            : '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: `1px solid ${theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.05)'}`,
                        }
                      }
                    }}
                  >
                    <MenuItem value="$" sx={{
                      color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(66, 66, 255, 0.2)'
                          : 'rgba(66, 66, 255, 0.1)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(66, 66, 255, 0.3)'
                            : 'rgba(66, 66, 255, 0.2)',
                        }
                      }
                    }}>US Dollar</MenuItem>
                    <MenuItem value="AUD" sx={{
                      color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(66, 66, 255, 0.2)'
                          : 'rgba(66, 66, 255, 0.1)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(66, 66, 255, 0.3)'
                            : 'rgba(66, 66, 255, 0.2)',
                        }
                      }
                    }}>Australian Dollar</MenuItem>
                    <MenuItem value="W" sx={{
                      color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(66, 66, 255, 0.2)'
                          : 'rgba(66, 66, 255, 0.1)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(66, 66, 255, 0.3)'
                            : 'rgba(66, 66, 255, 0.2)',
                        }
                      }
                    }}>Korean Won</MenuItem>
                    <MenuItem value="R" sx={{
                      color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(66, 66, 255, 0.2)'
                          : 'rgba(66, 66, 255, 0.1)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(66, 66, 255, 0.3)'
                            : 'rgba(66, 66, 255, 0.2)',
                        }
                      }
                    }}>Khmer Riel</MenuItem>
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
                  onChange={(_, newValue) => {
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
                    mt: 2,
                    borderTop: `1px solid ${theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)'}`,
                    paddingTop: 3,
                  }}
                >
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleCancelClick(values)}
                    sx={{
                      height: "48px",
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'rgba(0, 0, 0, 0.15)',
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.7)'
                        : 'rgba(0, 0, 0, 0.6)',
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: "500",
                      fontSize: { xs: "0.9rem", md: "1rem" },
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 100, 100, 0.5)'
                          : 'rgba(211, 47, 47, 0.5)',
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(211, 47, 47, 0.1)'
                          : 'rgba(211, 47, 47, 0.05)',
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(255, 100, 100, 0.9)'
                          : 'rgba(211, 47, 47, 0.9)',
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    fullWidth
                    disabled={isSubmitting}
                    startIcon={
                      isSubmitting ? <CircularProgress size="1.2rem" color="inherit" /> : null
                    }
                    sx={{
                      height: "48px",
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(66, 66, 255, 0.8)'
                        : 'rgba(66, 66, 255, 0.9)',
                      color: "#fff",
                      textTransform: "none",
                      fontWeight: "500",
                      fontSize: { xs: "0.9rem", md: "1rem" },
                      borderRadius: "10px",
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 10px rgba(0, 0, 0, 0.3)'
                        : '0 4px 10px rgba(0, 123, 255, 0.2)',
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(66, 66, 255, 0.9)'
                          : 'rgba(66, 66, 255, 1)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 6px 15px rgba(0, 0, 0, 0.4)'
                          : '0 6px 15px rgba(0, 123, 255, 0.3)',
                        transform: 'translateY(-2px)',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(66, 66, 255, 0.3)'
                          : 'rgba(66, 66, 255, 0.4)',
                        color: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(255, 255, 255, 0.7)',
                      }
                    }}
                  >
                    {isSubmitting ? "Creating..." : "Create Note"}
                  </Button>
                </Box>
              </Box>
              </motion.div>
            </form>
          )}
        </Formik>

        {/* Information panel - only visible on desktop */}
        {isNonMobile && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ width: "100%", maxWidth: "450px" }}
          >
            <Box
              sx={{
                width: "100%",
                borderRadius: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                padding: "32px",
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(20, 23, 39, 0.8)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)'}`,
                position: "relative",
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(40, 43, 59, 0.2) 0%, rgba(20, 23, 39, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(240, 240, 240, 0.2) 100%)',
                  zIndex: -1,
                  borderRadius: "16px",
                },
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                  fontSize: { xs: '1.5rem', md: '1.8rem' },
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <GroupsIcon sx={{ mr: 1.5, color: theme.palette.mode === 'dark'
                  ? 'rgba(66, 66, 255, 0.8)'
                  : 'rgba(66, 66, 255, 0.9)',
                }} />
                About Notes
              </Typography>

              <Card sx={{
                mb: 3,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(30, 33, 49, 0.7)'
                  : 'rgba(245, 245, 255, 0.7)',
                backdropFilter: 'blur(5px)',
                borderRadius: '12px',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                  : '0 4px 12px rgba(0, 0, 0, 0.05)',
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: theme.palette.mode === 'dark' ? '#fff' : '#333' }}>
                    What is a Note?
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                    A Note is a shared space where you and your friends can track expenses, plan trips, or manage any shared costs. Perfect for roommates, travel groups, or projects.
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="h6" sx={{
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                display: 'flex',
                alignItems: 'center',
                mb: 2,
              }}>
                <CurrencyExchangeIcon sx={{ mr: 1, color: theme.palette.mode === 'dark'
                  ? 'rgba(66, 66, 255, 0.8)'
                  : 'rgba(66, 66, 255, 0.9)',
                }} />
                Tips for Creating a Note
              </Typography>

              <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1, color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                  Choose a descriptive name that everyone will recognize
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1, color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                  Select the currency you'll primarily use
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1, color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                  Add all members who will share expenses
                </Typography>
                <Typography component="li" variant="body2" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                  You can always add more members later
                </Typography>
              </Box>

              <Divider sx={{
                my: 2,
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              }} />

              <Box sx={{
                p: 2,
                borderRadius: '12px',
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(66, 66, 255, 0.15)'
                  : 'rgba(66, 66, 255, 0.05)',
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(66, 66, 255, 0.3)'
                  : 'rgba(66, 66, 255, 0.2)'}`,
              }}>
                <Typography variant="body2" sx={{
                  fontWeight: 500,
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                }}>
                  After creating a note, you'll be able to add expenses, track balances, and see who owes what to whom.
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}
      </Box>
      <Dialog
        open={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)'}`,
            overflow: 'hidden',
            maxWidth: '400px',
            width: '100%',
            margin: { xs: '16px', md: 'auto' },
            position: 'relative',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(40, 43, 59, 0.2) 0%, rgba(20, 23, 39, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(240, 240, 240, 0.2) 100%)',
              zIndex: -1,
            }
          },
        }}
      >
        <DialogTitle sx={{
          textAlign: 'center',
          fontSize: { xs: '1.2rem', md: '1.4rem' },
          fontWeight: 600,
          color: theme.palette.mode === 'dark' ? '#fff' : '#333',
          pt: 3,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)'}`,
        }}>
          Confirm Cancel
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <DialogContentText
            sx={{
              color: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(0, 0, 0, 0.6)',
              textAlign: 'center',
              fontSize: '1rem',
            }}
          >
            You have unsaved changes. Are you sure you want to cancel?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{
          padding: { xs: "16px 24px 24px", md: "16px 24px 24px" },
          position: "relative",
          zIndex: 1,
          borderTop: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.08)'}`,
          display: "flex",
          justifyContent: "center",
          gap: 2
        }}>
          <Button
            onClick={() => setShowConfirmCancel(false)}
            variant="outlined"
            sx={{
              color: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(0, 0, 0, 0.6)',
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.15)',
              textTransform: "none",
              fontWeight: "500",
              fontSize: { xs: "0.8rem", md: "0.9rem" },
              padding: { xs: "6px 16px", md: "8px 20px" },
              borderRadius: "8px",
              '&:hover': {
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.25)'
                  : 'rgba(0, 0, 0, 0.25)',
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            No, go back
          </Button>
          <Button
            onClick={handleConfirmCancel}
            variant="contained"
            autoFocus
            sx={{
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(211, 47, 47, 0.8)'
                : 'rgba(211, 47, 47, 0.9)',
              color: "#fff",
              textTransform: "none",
              fontWeight: "500",
              fontSize: { xs: "0.8rem", md: "0.9rem" },
              padding: { xs: "6px 16px", md: "8px 20px" },
              borderRadius: "8px",
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 10px rgba(0, 0, 0, 0.3)'
                : '0 4px 10px rgba(211, 47, 47, 0.2)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(211, 47, 47, 0.9)'
                  : 'rgba(211, 47, 47, 1)',
              }
            }}
          >
            Yes, cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile info panel - only shown on small screens */}
      {!isNonMobile && (
        <Dialog
          open={false} // Set to true to show this dialog
          onClose={() => {}} // Add handler to close
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(20, 23, 39, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              maxWidth: '90%',
              width: '90%',
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)'}`,
          }}>
            <GroupsIcon sx={{ mr: 1.5, color: theme.palette.mode === 'dark'
              ? 'rgba(66, 66, 255, 0.8)'
              : 'rgba(66, 66, 255, 0.9)',
            }} />
            <Typography variant="h6">
              About Notes
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mt: 2 }}>
              A Note is a shared space where you and your friends can track expenses, plan trips, or manage any shared costs.
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
              Tips for Creating a Note:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Choose a descriptive name that everyone will recognize
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Select the currency you'll primarily use
              </Typography>
              <Typography component="li" variant="body2">
                Add all members who will share expenses
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {}} color="primary">
              Got it
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Success/Error Snackbar */}
      <CustomSnackbar
        open={showSnackbar.open}
        message={showSnackbar.message}
        severity={showSnackbar.severity}
        onClose={handleSnackbarClose}
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

// End of file
