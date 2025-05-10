import * as React from "react";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { usePostAddTripMutation, usePostEditTripMutation } from "../api/api";
import {
  Box,
  CircularProgress,
  Chip,
  IconButton,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  ListItemText,
  Tooltip,
  alpha,
  Popper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import RemoveIcon from "@mui/icons-material/Remove";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import CloseIcon from "@mui/icons-material/Close";
import { tokens } from "../theme";
import CustomAlert from "./CustomAlert";
import CurrencyConverterDialog from "./CurrencyConverterDialog";
import { motion } from "framer-motion";
import moment from "moment";

const filter = createFilterOptions();

export default function EditTrip({
  triggerTrip,
  member,
  secret,
  trip,
  group_id,
  currencyType,
}) {
  // Debug the trip prop
  React.useEffect(() => {
    console.log("Trip prop:", trip);
    if (Array.isArray(trip)) {
      console.log("Trip array length:", trip.length);
      if (trip.length > 0) {
        console.log("First trip sample:", trip[0]);
      }
    } else {
      console.log("Trip is not an array:", typeof trip);
    }
  }, [trip]);
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);
  const [triggerAddTrip, resultAddTrip] = usePostAddTripMutation();
  const [triggerEditTrip, resultEditTrip] = usePostEditTripMutation();
  const [money, setMoney] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertType, setAlertType] = React.useState("success");
  const [selectedChip, setSelectedChip] = React.useState(null);
  const [customAmount, setCustomAmount] = React.useState("");
  const [selectedPayerId, setSelectedPayerId] = React.useState("");
  const [isEachMember, setIsEachMember] = React.useState(false);
  const [selectedMembers, setSelectedMembers] = React.useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = React.useState([]);
  const [converterOpen, setConverterOpen] = React.useState(false);
  const [converterAmount, setConverterAmount] = React.useState("");
  const [converterCurrency, setConverterCurrency] = React.useState("");
  const [converterField, setConverterField] = React.useState("");
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleClose = () => {
    setDialogValue({
      trp_name: "",
      spended: "",
      payer_id: "",
    });
    setValue("");
    setMoney("");
    setSelectedPayerId("");
    setIsEachMember(false);
    // Reset selected members to all members
    if (member && member.length > 0) {
      setSelectedMembers(member.map(m => m.mem_name));
      setSelectedMemberIds(member.map(m => m.id));
    } else {
      setSelectedMembers([]);
      setSelectedMemberIds([]);
    }
    toggleOpen(false);
  };

  const [dialogValue, setDialogValue] = React.useState({
    trp_name: "",
    spended: "",
    payer_id: "",
  });

  const handleTransaction = (type) => {
    if (!!value?.trp_name && !isNaN(parseFloat(money))) {
      setLoading(true);
      let adjustedMoney = parseFloat(money);

      // If "Each" is checked, multiply by the number of members
      if (isEachMember && member && member.length > 0) {
        adjustedMoney = adjustedMoney * member.length;
      }

      triggerEditTrip({
        trp_name: value.trp_name,
        spend: adjustedMoney,
        group_id,
        update_dttm: moment().format("YYYY-MM-DD HH:mm:ss"),
        type,
        payer_id: selectedPayerId,
        description: isEachMember ? `Each member: ${money}` : "",
      })
        .then((response) => {
          if (response?.data?.status) {
            setAlertMessage(response?.data?.message);
            setAlertType("success");
          } else {
            setAlertMessage(response?.data?.message);
            setAlertType("error");
          }
          setAlertOpen(true);
        })
        .finally(() => {
          setLoading(false);
          setValue(null);
          setMoney("");
          setSelectedChip(null);
        });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);

    // Calculate the spend amount based on whether "Each" is checked
    let spendAmount = parseFloat(dialogValue.spended);
    if (isEachMember && selectedMemberIds && selectedMemberIds.length > 0) {
      spendAmount = spendAmount * selectedMemberIds.length;
    }

    triggerAddTrip({
      trp_name: dialogValue.trp_name,
      spend: spendAmount,
      admn_id: secret,
      mem_id: JSON.stringify(selectedMemberIds),
      description: isEachMember ? `Each member: ${dialogValue.spended}` : "",
      group_id,
      create_date: moment().format("YYYY-MM-DD HH:mm:ss"),
      update_dttm: moment().format("YYYY-MM-DD HH:mm:ss"),
      type: "ADD",
      payer_id: dialogValue.payer_id,
    })
      .then((response) => {
        if (response?.data?.status) {
          setAlertMessage("Trip added successfully!");
          setAlertType("success");
        } else {
          setAlertMessage(`Failed to add trip: ${response?.data?.message}`);
          setAlertType("error");
        }
        setAlertOpen(true);
      })
      .finally(() => {
        setDialogValue({
          ...dialogValue,
          trp_name: "",
          spended: "",
          payer_id: "",
        });
        handleClose();
        setLoading(false);
      });
  };

  React.useEffect(() => {
    if (resultEditTrip.data?.status || resultAddTrip.data?.status) {
      triggerTrip({ group_id });
      handleClose();
    }
  }, [resultEditTrip, resultAddTrip]);

  // Initialize selected members when component mounts or member list changes
  React.useEffect(() => {
    if (member && member.length > 0) {
      setSelectedMembers(member.map(m => m.mem_name));
      setSelectedMemberIds(member.map(m => m.id));
    }
  }, [member]);

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
    const amount = selectedChip !== null ? selectedChip : parseFloat(customAmount || 0);
    if (!isNaN(amount)) {
      setMoney((prev) => (parseFloat(prev || 0) + amount).toString());
    }
  };

  const handleSubtractClick = () => {
    const amount = selectedChip !== null ? selectedChip : parseFloat(customAmount || 0);
    if (!isNaN(amount)) {
      setMoney((prev) => Math.max(0, parseFloat(prev || 0) - amount).toString());
    }
  };

  const handleMemberChange = (event) => {
    const { value } = event.target;
    const memberNames = typeof value === "string" ? value.split(",") : value;
    setSelectedMembers(memberNames);

    // Update selected member IDs based on selected names
    const memberIds = member
      .filter(m => memberNames.includes(m.mem_name))
      .map(m => m.id);
    setSelectedMemberIds(memberIds);
  };

  // Currency converter handlers
  const handleOpenConverter = (amount, currency, field) => {
    setConverterAmount(amount);
    setConverterCurrency(currency);
    setConverterField(field);
    setConverterOpen(true);
  };

  const handleCloseConverter = () => {
    setConverterOpen(false);
  };

  const handleConversionComplete = (convertedAmount) => {
    // Update the appropriate field with the converted amount
    if (converterField === "money") {
      setMoney(convertedAmount);
    } else if (converterField === "dialogSpend") {
      setDialogValue({
        ...dialogValue,
        spended: convertedAmount,
      });
    } else if (converterField === "customAmount") {
      setCustomAmount(convertedAmount);
      setSelectedChip(null);
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
        }}
      >
        {/* Simplified Autocomplete component */}
        <Autocomplete
          disablePortal
          value={value}
          onChange={(_, newValue) => {
            if (typeof newValue === "string") {
              // Handle string input (new trip name)
              toggleOpen(true);
              setDialogValue({
                trp_name: newValue,
                spended: "",
              });
            } else if (newValue && newValue.inputValue) {
              // Handle "Add new" option
              toggleOpen(true);
              setDialogValue({
                trp_name: newValue.inputValue,
                spended: "",
              });
            } else {
              // Handle selecting existing trip
              setValue(newValue);
              if (newValue) {
                setMoney(newValue.spend || "");
                setSelectedPayerId(newValue.payer_id || "");
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
                trp_name: `Add "${params.inputValue}"`,
              });
            }

            return filtered;
          }}
          options={Array.isArray(trip) ? trip : []}
          getOptionLabel={(option) => {
            // Handle different option types
            if (!option) return '';
            if (typeof option === "string") return option;
            if (option.inputValue) return option.inputValue;
            return option.trp_name || '';
          }}
          renderOption={(props, option) => (
            <li
              {...props}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 34, 51, 0.95)' : '#fff',
                borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #eee',
                width: '100%'
              }}
            >
              {option.trp_name || (option.inputValue ? `Add "${option.inputValue}"` : '')}
            </li>
          )}
          freeSolo
          renderInput={(params) => (
            <TextField
              color="primary"
              {...params}
              variant="standard"
              label="Select or Add Trip"
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
              backdropFilter: 'blur(10px)',
              width: '100%'
            }
          }}
          PopperComponent={(props) => (
            <Popper
              {...props}
              style={{
                zIndex: 9999,
                backdropFilter: 'blur(10px)',
                width: props.anchorEl ? props.anchorEl.clientWidth + 'px' : 'auto'
              }}
              modifiers={[
                {
                  name: 'offset',
                  options: {
                    offset: [0, 8],
                  },
                },
                {
                  name: 'sameWidth',
                  enabled: true,
                  fn: ({ state }) => {
                    state.styles.popper.width = `${state.rects.reference.width}px`;
                    return state;
                  },
                  phase: 'beforeWrite',
                  requires: ['computeStyles'],
                },
              ]}
            />
          )}
        />

        <Box>
          <Box display="flex" alignItems="center">
            <TextField
              variant="standard"
              type="text"
              label="Spend"
              color="primary"
              value={money}
              onChange={(e) => {
                e.target.value = e.target.value.trim();
                if (isNaN(Number(e.target.value)) && e.target.value !== ".") return;
                setMoney(e.target.value);
              }}
              disabled={loading}
              sx={{
                flex: 1,
                "& .MuiInputBase-input": {
                  color: colors.primary[600],
                },
                "& .MuiInputLabel-root": {
                  color: colors.primary[500],
                },
                "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.primary[400],
                },
              }}
            />
            <Tooltip title="Convert Currency">
              <IconButton
                onClick={() => handleOpenConverter(money, currencyType, "money")}
                color="primary"
                disabled={loading || !money || isNaN(parseFloat(money))}
                sx={{ ml: 0.5 }}
              >
                <CurrencyExchangeIcon />
              </IconButton>
            </Tooltip>
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

          <FormControlLabel
            control={
              <Checkbox
                checked={isEachMember}
                onChange={(e) => setIsEachMember(e.target.checked)}
                color="primary"
                sx={{
                  color: colors.primary[500],
                  '&.Mui-checked': {
                    color: colors.primary[500],
                  },
                }}
              />
            }
            label="Each member pays this amount"
            sx={{
              mt: 1,
              color: colors.primary[600],
              '& .MuiFormControlLabel-label': {
                fontSize: '0.85rem',
              }
            }}
          />

          {isEachMember && money && !isNaN(parseFloat(money)) && selectedMemberIds && selectedMemberIds.length > 0 && (
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                color: colors.primary[500],
                fontStyle: 'italic',
                fontSize: '0.85rem',
              }}
            >
              Total: {currencyType}{(parseFloat(money) * selectedMemberIds.length).toFixed(2)}
              ({selectedMemberIds.length} members × {currencyType}{parseFloat(money).toFixed(2)})
            </Typography>
          )}
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
                backgroundColor: selectedChip === amount ? colors.primary[500] : "inherit",
                color: selectedChip === amount ? "#fff" : colors.primary[600],
              }}
            />
          ))}
          <Box display="flex" alignItems="center">
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
                  setSelectedChip(null);
                }
              }}
              sx={{
                ml: 1,
                width: '80px',
                "& .MuiInputBase-input": {
                  color: colors.primary[600],
                },
                "& .MuiInputLabel-root": {
                  color: colors.primary[500],
                },
                "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                  borderColor: colors.primary[400],
                },
              }}
            />
            <Tooltip title="Convert Currency">
              <IconButton
                onClick={() => handleOpenConverter(customAmount, currencyType, "customAmount")}
                color="primary"
                disabled={loading || !customAmount || isNaN(parseFloat(customAmount))}
                size="small"
                sx={{ ml: 0.5 }}
              >
                <CurrencyExchangeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {value && (
          <FormControl variant="standard" fullWidth sx={{ mt: 2 }}>
            <InputLabel
              color="primary"
              sx={{
                color: colors.primary[500],
              }}
            >
              Who paid?
            </InputLabel>
            <Select
              value={selectedPayerId}
              onChange={(e) => setSelectedPayerId(e.target.value)}
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
                <em>None</em>
              </MenuItem>
              {member?.map((item) => (
                <MenuItem
                  key={item.id}
                  value={item.id}
                  sx={{
                    color: colors.primary[600],
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
        )}

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
        TransitionComponent={motion.div}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& .MuiDialog-container': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
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
            margin: '0 auto',
            position: 'relative',
            minWidth: { xs: "90%", sm: "450px", md: "500px" },
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
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                fontSize: { xs: "1.1rem", md: "1.2rem" },
                fontWeight: 600,
                letterSpacing: "-0.01em"
              }}
            >
              New trip
            </Typography>
            <IconButton
              onClick={handleClose}
              size="small"
              component={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
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
              overflowY: "auto",
            }}
          >
            <TextField
              autoFocus
              margin="dense"
              id="trp_name"
              value={dialogValue.trp_name}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  trp_name: event.target.value,
                })
              }
              label="Trip's Name"
              type="text"
              variant="standard"
              fullWidth
              sx={{
                mb: 2,
                "& .MuiInputBase-input": {
                  color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                },
                "& .MuiInputLabel-root": {
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[600],
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
              }}
            />
            <Box>
              <Box display="flex" alignItems="center">
                <TextField
                  margin="dense"
                  id="spended"
                  value={dialogValue.spended}
                  onChange={(e) => {
                    e.target.value = e.target.value.trim();
                    if (isNaN(Number(e.target.value)) && e.target.value !== ".") return;
                    setDialogValue({
                      ...dialogValue,
                      spended: e.target.value,
                    });
                  }}
                  label="Spend"
                  type="text"
                  variant="standard"
                  fullWidth
                  sx={{
                    "& .MuiInputBase-input": {
                      color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                    },
                    "& .MuiInputLabel-root": {
                      color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[600],
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
                  }}
                />
                <Tooltip title="Convert Currency">
                  <IconButton
                    onClick={() => handleOpenConverter(dialogValue.spended, currencyType, "dialogSpend")}
                    disabled={!dialogValue.spended || isNaN(parseFloat(dialogValue.spended))}
                    sx={{
                      ml: 0.5,
                      color: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[600],
                      '&.Mui-disabled': {
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                      }
                    }}
                  >
                    <CurrencyExchangeIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={isEachMember}
                    onChange={(e) => setIsEachMember(e.target.checked)}
                    sx={{
                      color: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[600],
                      '&.Mui-checked': {
                        color: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[600],
                      }
                    }}
                  />
                }
                label="Each member pays this amount"
                sx={{
                  mt: 1,
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.85rem',
                  }
                }}
              />

              {isEachMember && dialogValue.spended && !isNaN(parseFloat(dialogValue.spended)) && selectedMemberIds && selectedMemberIds.length > 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    color: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[600],
                    fontStyle: 'italic',
                    fontSize: '0.85rem',
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(0, 123, 255, 0.1)'
                      : 'rgba(0, 123, 255, 0.05)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}
                >
                  Total: {currencyType}{(parseFloat(dialogValue.spended) * selectedMemberIds.length).toFixed(2)}
                  ({selectedMemberIds.length} members × {currencyType}{parseFloat(dialogValue.spended).toFixed(2)})
                </Typography>
              )}
            </Box>
            <FormControl variant="standard" fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel
                sx={{
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[600],
                }}
              >
                Members
              </InputLabel>
              <Select
                multiple
                value={selectedMembers}
                onChange={handleMemberChange}
                renderValue={(selected) => selected.join(", ")}
                sx={{
                  "& .MuiInputBase-input": {
                    color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
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
                }}
              >
                {member?.map((item) => (
                  <MenuItem
                    key={item.id}
                    value={item.mem_name}
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(20, 23, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 33, 49, 0.9)' : 'rgba(245, 245, 245, 0.9)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(40, 43, 59, 0.9)' : 'rgba(235, 235, 235, 0.9)',
                      }
                    }}
                  >
                    <Checkbox
                      checked={selectedMembers.includes(item.mem_name)}
                      sx={{
                        color: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[600],
                        '&.Mui-checked': {
                          color: theme.palette.mode === 'dark' ? colors.primary[400] : colors.primary[600],
                        }
                      }}
                    />
                    <ListItemText
                      primary={item.mem_name}
                      sx={{
                        color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                      }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl variant="standard" fullWidth sx={{ mt: 2 }}>
              <InputLabel
                sx={{
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[600],
                }}
              >
                Who paid?
              </InputLabel>
              <Select
                value={dialogValue.payer_id}
                onChange={(e) =>
                  setDialogValue({
                    ...dialogValue,
                    payer_id: e.target.value,
                  })
                }
                sx={{
                  "& .MuiInputBase-input": {
                    color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
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
                }}
              >
                {member?.map((item) => (
                  <MenuItem
                    key={item.id}
                    value={item.id}
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(20, 23, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 33, 49, 0.9)' : 'rgba(245, 245, 245, 0.9)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(40, 43, 59, 0.9)' : 'rgba(235, 235, 235, 0.9)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(50, 53, 69, 0.9)' : 'rgba(225, 225, 225, 0.9)',
                        },
                      },
                    }}
                  >
                    {item.mem_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              gap: 1
            }}
          >
            <Button
              variant="outlined"
              onClick={loading ? null : handleClose}
              disabled={loading}
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
              variant="contained"
              type="submit"
              startIcon={loading && <CircularProgress size={20} />}
              disabled={loading}
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? colors.primary[600] : colors.primary[500],
                color: "#fff",
                textTransform: "none",
                fontWeight: "500",
                fontSize: { xs: "0.8rem", md: "0.9rem" },
                padding: { xs: "6px 16px", md: "8px 20px" },
                borderRadius: "8px",
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 10px rgba(0, 0, 0, 0.3)'
                  : '0 4px 10px rgba(0, 123, 255, 0.2)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? colors.primary[500] : colors.primary[400],
                }
              }}
            >
              Add
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

      {/* Currency Converter Dialog */}
      <CurrencyConverterDialog
        open={converterOpen}
        onClose={handleCloseConverter}
        initialAmount={converterAmount}
        initialFromCurrency={converterCurrency === "$" ? "USD" : converterCurrency === "W" ? "KRW" : converterCurrency === "R" ? "ZAR" : converterCurrency}
        onConversionComplete={handleConversionComplete}
      />
    </React.Fragment>
  );
}

// Helper function to convert member key to array (kept for reference)
// function convertMemKeyToArray(member, key) {
//   let newArray = [];
//   for (let i in member) {
//     newArray[i] = member[i][key];
//   }
//   return newArray;
// }
