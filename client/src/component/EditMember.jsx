import * as React from "react";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import {
  usePostAddMemberMutation,
  usePostEditMemberMutation,
} from "../api/api";
import {
  Box,
  CircularProgress,
  Chip,
  IconButton,
  useTheme,
  Typography,
  alpha,
  Popper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "../theme";
import CustomAlert from "../component/CustomAlert";
import { numberAddition } from "../help/helper";
import { motion } from "framer-motion";

const filter = createFilterOptions();

export default function EditMember({
  triggerMember,
  member,
  group_id,
  currencyType,
}) {
  // Debug the member prop
  React.useEffect(() => {
    console.log("Member prop:", member);
    if (Array.isArray(member)) {
      console.log("Member array length:", member.length);
      if (member.length > 0) {
        console.log("First member sample:", member[0]);
      }
    } else {
      console.log("Member is not an array:", typeof member);
    }
  }, [member]);
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);
  const [triggerAddMember, resultAddMember] = usePostAddMemberMutation();
  const [triggerEditMember, resultEditMember] = usePostEditMemberMutation();
  const [money, setMoney] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertType, setAlertType] = React.useState("success");
  const [selectedChip, setSelectedChip] = React.useState(null);
  const [customAmount, setCustomAmount] = React.useState(""); // New state for custom amount
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const handleClose = () => {
    setDialogValue({
      mem_name: "",
      paid: "",
    });
    setValue("");
    setMoney("");
    toggleOpen(false);
  };

  const [dialogValue, setDialogValue] = React.useState({
    mem_name: "",
    paid: "",
  });

  const handleTransaction = (type) => {
    if (!!value?.id && !isNaN(parseFloat(money))) {
      setLoading(true);
      const adjustedMoney = parseFloat(money);

      triggerEditMember({
        user_id: value.id,
        paid: adjustedMoney,
        group_id,
        type,
      })
        .then((response) => {
          if (response?.data?.status) {
            setAlertMessage("Transaction successful!");
            setAlertType("success");
          } else {
            setAlertMessage(`Transaction failed: ${response?.data?.message}`);
            setAlertType("error");
          }
          setAlertOpen(true);
        })
        .finally(() => {
          setLoading(false);
          setValue(null);
          setMoney("");
          setSelectedChip(null);
          triggerMember({ group_id });
        });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    triggerAddMember({
      mem_name: dialogValue.mem_name,
      paid: parseFloat(dialogValue.paid),
      group_id,
    })
      .then((response) => {
        if (response?.data?.status) {
          setAlertMessage("Member added successfully!");
          setAlertType("success");
        } else {
          setAlertMessage(`Failed to add member: ${response?.data?.message}`);
          setAlertType("error");
        }
        setAlertOpen(true);
      })
      .finally(() => {
        setDialogValue({
          ...dialogValue,
          mem_name: "",
          paid: "",
        });
        handleClose();
        setLoading(false);
        triggerMember({ group_id });
      });
  };

  const currencySuggestions = {
    $: [5, 10, 20, 50, 100],
    "AUD": [5, 10, 20, 50, 100],
    W: [1000, 5000, 10000, 50000, 100000],
    R: [2000, 5000, 10000, 20000, 50000],
  };

  const handleChipClick = (amount) => {
    setSelectedChip(amount);
  };

  const handleAddClick = () => {
    const amount =
      selectedChip !== null ? selectedChip : parseFloat(customAmount || 0);
    if (!isNaN(amount)) {
      setMoney((prev) => (parseFloat(prev || 0) + amount).toString());
    }
  };

  const handleSubtractClick = () => {
    const amount =
      selectedChip !== null ? selectedChip : parseFloat(customAmount || 0);
    if (!isNaN(amount)) {
      setMoney((prev) =>
        Math.max(0, parseFloat(prev || 0) - amount).toString()
      );
    }
  };

  return (
    <React.Fragment>
      <Box
        display="grid"
        gap="10px"
        gridTemplateColumns="repeat(4, 1fr)"
        sx={{
          "& > div": { gridColumn: "span 4" },
          marginBottom: "10px",
        }}
      >
        {/* Simplified Autocomplete component */}
        <Autocomplete
          disablePortal
          value={value}
          onChange={(_, newValue) => {
            if (typeof newValue === "string") {
              // Handle string input (new member name)
              setTimeout(() => {
                toggleOpen(true);
                setDialogValue({
                  mem_name: newValue,
                  paid: "",
                });
              });
            } else if (newValue && newValue.inputValue) {
              // Handle "Add new" option
              toggleOpen(true);
              setDialogValue({
                mem_name: newValue.inputValue,
                paid: "",
              });
            } else {
              // Handle selecting existing member
              setValue(newValue);
              if (newValue && newValue.paid) {
                setMoney(newValue.paid);
                setSelectedChip(currencySuggestions[currencyType][0]);
              }
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            // Add "create new" option
            if (params.inputValue !== "") {
              filtered.push({
                inputValue: params.inputValue,
                mem_name: `Add "${params.inputValue}"`,
              });
            }

            return filtered;
          }}
          options={Array.isArray(member) ? member : []}
          getOptionLabel={(option) => {
            // Handle different option types
            if (!option) return '';
            if (typeof option === "string") return option;
            if (option.inputValue) return option.inputValue;
            return option.mem_name || '';
          }}
          renderOption={(props, option) => (
            <li
              {...props}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 34, 51, 0.95)' : '#fff',
                borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #eee'
              }}
            >
              {option.mem_name || (option.inputValue ? `Add "${option.inputValue}"` : '')}
            </li>
          )}
          freeSolo
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Member"
              variant="standard"
              InputProps={{
                ...params.InputProps,
                style: { color: theme.palette.text.primary }
              }}
              sx={{
                "& .MuiInputBase-input": {
                  color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.primary[600],
                },
                "& .MuiInputLabel-root": {
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.primary[500],
                },
                "& .MuiInput-underline:before": {
                  borderBottomColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                },
                "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                  borderBottomColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.2)',
                },
                "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : colors.primary[400],
                },
              }}
            />
          )}
          ListboxProps={{
            style: {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 34, 51, 0.95)' : '#fff',
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              maxHeight: '300px',
              overflow: 'auto',
              borderRadius: '8px',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 16px rgba(0, 0, 0, 0.6)'
                : '0 8px 16px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)'
            }
          }}
          PopperComponent={(props) => (
            <Popper
              {...props}
              style={{
                zIndex: 9999,
                backdropFilter: 'blur(10px)'
              }}
              modifiers={[
                {
                  name: 'offset',
                  options: {
                    offset: [0, 8],
                  },
                },
              ]}
            />
          )}
        />

        <Box display="flex" alignItems="center">
          <TextField
            variant="standard"
            type="text"
            label="Paid"
            color="primary"
            value={money}
            onChange={(e) => {
              e.target.value = e.target.value.trim();
              if (isNaN(Number(e.target.value)) && e.target.value !== ".")
                return;
              setMoney(e.target.value);
            }}
            disabled={loading}
            InputProps={{
              style: {
                color: theme.palette.text.primary,
              },
            }}
            sx={{
              flex: 1,
              "& .MuiInputLabel-root": {
                color: colors.primary[500],
              },
              "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[400],
              },
              "& input:-webkit-autofill": {
                WebkitBoxShadow: `0 0 0 1000px ${colors.grey[800]} inset !important`,
                WebkitTextFillColor: `${colors.primary[100]} !important`,
              },
            }}
          />
          <IconButton
            onClick={handleSubtractClick}
            color="secondary"
            disabled={loading || (selectedChip === null && !customAmount)}
          >
            <RemoveIcon />
          </IconButton>
          <IconButton
            onClick={handleAddClick}
            color="primary"
            disabled={loading || (selectedChip === null && !customAmount)}
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Box display="flex" flexWrap="wrap" alignItems="center" sx={{ mt: 1 }}>
          {currencySuggestions[currencyType]?.map((amount, index) => (
            <Chip
              key={index}
              label={`${currencyType}${amount}`}
              onClick={() => handleChipClick(amount)}
              color={selectedChip === amount ? "primary" : "default"}
              sx={{
                m: 0.5,
                backgroundColor:
                  selectedChip === amount ? colors.primary[500] : "inherit",
                color: selectedChip === amount ? "#fff" : colors.primary[600],
              }}
            />
          ))}
          {Array.isArray(member) &&
            member.map((item, _) => {
              if (item["id"] === value?.id) {
                const amount = item["unpaid"];
                return (
                  <Chip
                    label={`${currencyType}${amount}`}
                    onClick={() => handleChipClick(amount)}
                    color={selectedChip === amount ? "primary" : "default"}
                    sx={{
                      m: 0.5,
                      backgroundColor:
                        selectedChip === amount
                          ? colors.primary[500]
                          : "inherit",
                      color:
                        selectedChip === amount ? "#fff" : colors.primary[600],
                    }}
                  />
                );
              }
            })}
          <TextField
            variant="standard"
            type="text"
            label="Custom"
            color="primary"
            value={customAmount}
            onChange={(e) => {
              e.target.value = e.target.value.trim();
              if (!isNaN(Number(e.target.value)) || e.target.value === "") {
                setCustomAmount(e.target.value);
                setSelectedChip(null); // Deselect chips when using custom input
              }
            }}
            InputProps={{
              style: {
                color: theme.palette.text.primary,
              },
            }}
            sx={{
              ml: 1,
              width: "80px",
              "& .MuiInputLabel-root": {
                color: colors.primary[500],
              },
              "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[400],
              },
              "& input:-webkit-autofill": {
                WebkitBoxShadow: `0 0 0 1000px ${colors.grey[800]} inset !important`,
                WebkitTextFillColor: `${colors.primary[100]} !important`,
              },
            }}
          />
        </Box>

        <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
          <Button
            onClick={() => handleTransaction("UPDATE")}
            color="primary"
            variant="contained"
            startIcon={loading && <CircularProgress size={20} />}
            disabled={loading || !value}
            sx={{
              flex: 1,
              ml: 1,
              backgroundColor: colors.primary[500],
              color: "#fff",
            }}
          >
            <SaveIcon />
            Save
          </Button>
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={loading ? null : handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, y: 20, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 20, scale: 0.95 },
          transition: { duration: 0.3 },
          sx: {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(20, 23, 39, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: { xs: "16px", md: "20px" },
            color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 25px rgba(0, 0, 0, 0.5)'
              : '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: "hidden",
          },
        }}
      >
        {/* Subtle gradient overlay for depth */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
              fontSize: { xs: "1.1rem", md: "1.2rem" },
              fontWeight: 600,
              padding: { xs: "0 0 16px 0", md: "0 0 20px 0" },
              position: "relative",
              zIndex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.08)'}`,
              marginBottom: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(0, 123, 255, 0.15)'
                    : 'rgba(0, 123, 255, 0.1)',
                  borderRadius: "12px",
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 1.5
                }}
              >
                <AddIcon
                  sx={{
                    color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                    fontSize: { xs: "1.2rem", md: "1.3rem" }
                  }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                  fontSize: { xs: "1.1rem", md: "1.2rem" },
                  fontWeight: 600,
                  letterSpacing: "-0.01em"
                }}
              >
                New Member
              </Typography>
            </Box>
            <IconButton
              onClick={loading ? null : handleClose}
              size="small"
              component={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(colors.grey[800], 0.5)
                  : alpha(colors.grey[200], 0.5),
                borderRadius: "8px",
                padding: "6px",
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(colors.grey[700], 0.7)
                    : alpha(colors.grey[300], 0.7),
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent
            sx={{
              color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
              padding: { xs: "16px 0", md: "20px 0" },
              position: "relative",
              zIndex: 1,
              fontSize: { xs: "0.9rem", md: "1rem" },
            }}
          >
            <TextField
              autoFocus
              margin="dense"
              id="mem_name"
              color="primary"
              value={dialogValue.mem_name}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  mem_name: event.target.value,
                })
              }
              label="Member's Name"
              type="text"
              variant="outlined"
              fullWidth
              InputProps={{
                style: {
                  color: theme.palette.text.primary,
                },
              }}
              sx={{
                mb: 2,
                "& .MuiInputLabel-root": {
                  color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(0, 0, 0, 0.15)',
                    borderRadius: "10px",
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(0, 0, 0, 0.25)',
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                  },
                },
              }}
            />
            <TextField
              margin="dense"
              id="paid"
              color="primary"
              value={dialogValue.paid}
              onChange={(e) => {
                e.target.value = e.target.value.trim();
                if (isNaN(Number(e.target.value)) && e.target.value !== ".")
                  return;
                setDialogValue({
                  ...dialogValue,
                  paid: e.target.value,
                });
              }}
              label="Paid Amount"
              type="text"
              variant="outlined"
              fullWidth
              InputProps={{
                style: {
                  color: theme.palette.text.primary,
                },
                startAdornment: (
                  <Box
                    component="span"
                    sx={{
                      color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                      mr: 0.5
                    }}
                  >
                    {currencyType}
                  </Box>
                ),
              }}
              sx={{
                "& .MuiInputLabel-root": {
                  color: theme.palette.mode === 'dark' ? colors.grey[400] : colors.grey[600],
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(0, 0, 0, 0.15)',
                    borderRadius: "10px",
                  },
                  "&:hover fieldset": {
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(0, 0, 0, 0.25)',
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                  },
                },
              }}
            />
          </DialogContent>

          <DialogActions
            sx={{
              padding: { xs: "16px 0 0 0", md: "20px 0 0 0" },
              position: "relative",
              zIndex: 1,
              borderTop: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.08)'}`,
              marginTop: 2,
              display: "flex",
              justifyContent: "flex-end",
              gap: 2
            }}
          >
            <Button
              onClick={loading ? null : handleClose}
              variant="outlined"
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                textTransform: "none",
                fontWeight: "500",
                fontSize: { xs: "0.8rem", md: "0.9rem" },
                padding: { xs: "6px 16px", md: "8px 20px" },
                borderRadius: "8px",
                '&:hover': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              startIcon={loading && <CircularProgress size="1rem" color="inherit" />}
              sx={{
                backgroundColor: colors.primary[theme.palette.mode === 'dark' ? 500 : 600],
                color: "#fff",
                "&:hover": {
                  backgroundColor: colors.primary[theme.palette.mode === 'dark' ? 600 : 700],
                },
                textTransform: "none",
                fontWeight: "500",
                fontSize: { xs: "0.8rem", md: "0.9rem" },
                padding: { xs: "6px 16px", md: "8px 20px" },
                borderRadius: "8px",
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 10px rgba(0, 123, 255, 0.2)'
                  : '0 4px 10px rgba(0, 123, 255, 0.15)',
              }}
            >
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <CustomAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </React.Fragment>
  );
}
