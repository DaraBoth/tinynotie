import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  useTheme,
  alpha,
  useMediaQuery,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import CloseIcon from "@mui/icons-material/Close";
import CustomAlert from "./CustomAlert";
import { tokens } from "../theme";
import currency from "currency.js";
import { motion } from "framer-motion";
import useWindowDimensions from "../hooks/useWindowDimensions";

export default function ShareModal({
  open,
  onClose,
  selectedTrips,
  currencyType,
  member,
}) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { width: windowWidth } = useWindowDimensions();

  // State for bank details
  const [bankName, setBankName] = useState(
    localStorage.getItem("bankName") || ""
  );
  const [bankAccount, setBankAccount] = useState(
    localStorage.getItem("bankAccount") || ""
  );

  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [invoiceText, setInvoiceText] = useState("");
  const [editableText, setEditableText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  useEffect(() => {
    if (selectedTrips.length) {
      setSelectedTripIds(selectedTrips.map((trip) => trip.id));
      generateInvoiceText(selectedTrips, selectedLanguage);
    }
  }, [selectedTrips, selectedLanguage, bankName, bankAccount]);

  const handleTripChange = (event) => {
    const selectedIds = event.target.value;
    setSelectedTripIds(selectedIds);
    const selected = selectedIds.map((id) =>
      selectedTrips.find((trip) => trip.id === id)
    );
    generateInvoiceText(selected, selectedLanguage);
  };

  const handleLanguageChange = (event, newLanguage) => {
    if (newLanguage) {
      setSelectedLanguage(newLanguage);
      generateInvoiceText(selectedTrips, newLanguage);
    }
  };

  // Update bank name and save to local storage
  const handleBankNameChange = (event) => {
    const newBankName = event.target.value;
    setBankName(newBankName);
    localStorage.setItem("bankName", newBankName);
  };

  // Update bank account number and save to local storage
  const handleBankAccountChange = (event) => {
    const newBankAccount = event.target.value;
    setBankAccount(newBankAccount);
    localStorage.setItem("bankAccount", newBankAccount);
  };

  const generateInvoiceText = (trips, language) => {
    const translations = {
      EN: {
        bankDetails: `${bankName}\n${bankAccount}\n\n`,
        greeting: "Hello!\nThis is the receipt.\n\n",
        totalAmount: "Total Amount",
        participants: "Participants",
        perMember: "Per Member",
        eachPersonPays: "Each Person Pays",
        paidBy: "Paid By",
        thankYou: "Thank you for your cooperation!",
      },
      KR: {
        bankDetails: `${bankName}\n${bankAccount}\n\n`,
        greeting: "안녕하세요!\n이것은 영수증입니다.\n\n",
        totalAmount: "총 금액",
        participants: "참여 멤버",
        perMember: "1인당 금액",
        eachPersonPays: "각 사람의 지불 금액",
        paidBy: "결제자",
        thankYou: "협조해 주셔서 감사합니다!",
      },
      KH: {
        bankDetails: `${bankName}\n${bankAccount}\n\n`,
        greeting: "សួស្ដី!\nនេះគឺជាវិក័យប័ត្រ។\n\n",
        totalAmount: "ចំនួន​សរុប",
        participants: "អ្នក​ចូលរួម",
        perMember: "ចំណាយតាមម្នាក់",
        eachPersonPays: "ការទូទាត់តាមម្នាក់",
        paidBy: "បង់ដោយ",
        thankYou: "អរគុណសម្រាប់កិច្ចសហការរបស់អ្នក!",
      },
    };

    const t = translations[language];
    let totalPerMember = {};

    const tripDetails = trips
      .map((trip) => {
        // Safely parse mem_id - handle both string and array formats
        let memberIds = [];
        try {
          memberIds = typeof trip.mem_id === 'string' ? JSON.parse(trip.mem_id) : trip.mem_id;
        } catch (e) {
          console.error("Error parsing mem_id:", e);
          memberIds = [];
        }

        // Get member names, filtering out any undefined values
        const members = memberIds
          .map(memId => {
            const memberObj = member.find(m => m.id === memId);
            return memberObj ? memberObj.mem_name : null;
          })
          .filter(name => name !== null);

        // Get payer name
        let payerName = "-";
        if (trip.payer_id) {
          const payer = member.find(m => m.id === Number(trip.payer_id));
          if (payer) {
            payerName = payer.mem_name;
          }
        }

        // Calculate per member amount only if there are members
        const memberCount = members.length || 1; // Avoid division by zero
        const perMemberAmount = currency(trip.spend / memberCount, {
          symbol: currencyType,
        }).format();

        // Update total per member
        members.forEach((mem) => {
          if (!totalPerMember[mem]) {
            totalPerMember[mem] = 0;
          }
          totalPerMember[mem] += trip.spend / memberCount;
        });

        return `${trip.trp_name}\n${t.totalAmount}: ${currency(trip.spend, {
          symbol: currencyType,
        }).format()}\n${t.paidBy}: ${payerName}\n${t.participants}: ${members.join(", ") || "-"}\n${
          t.perMember
        }: ${perMemberAmount}\n\n`;
      })
      .join("");

    const totalSpend = trips.reduce((acc, trip) => acc + trip.spend, 0);

    let summary = "";
    if (trips.length > 1) {
      const perPersonDetail = Object.entries(totalPerMember)
        .map(([name, amount]) => {
          return `${name}: ${currency(amount, {
            symbol: currencyType,
          }).format()}`;
        })
        .join("\n");

      summary = `${t.totalAmount}: ${currency(totalSpend, {
        symbol: currencyType,
      }).format()}\n${t.eachPersonPays}:\n${perPersonDetail}\n\n${t.thankYou}`;
    } else {
      summary = `${t.thankYou}`;
    }

    const fullText = t.bankDetails + t.greeting + tripDetails + summary;
    setInvoiceText(fullText);
    setEditableText(fullText);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(invoiceText)
      .then(() => {
        setAlertMessage("Copied to clipboard!");
        setAlertType("success");
        setAlertOpen(true);
      })
      .catch(() => {
        setAlertMessage("Failed to copy!");
        setAlertType("error");
        setAlertOpen(true);
      });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setInvoiceText(editableText);
    }
    setIsEditing(!isEditing);
  };

  const handleTextChange = (e) => {
    setEditableText(e.target.value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        zIndex: 1600, // Higher z-index to ensure it appears above floating buttons
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
          margin: isMobile ? '32px' : '16px',
          width: isMobile ? `${windowWidth - 64}px` : "auto", // Calculate exact width with even larger margins
          maxWidth: isMobile ? `${windowWidth - 64}px` : "550px",
          minWidth: isMobile ? "auto" : "450px", // Override default minWidth for mobile
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

      <DialogTitle
        sx={{
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
            <ShareIcon
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
            Share Invoice
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
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
          padding: { xs: "16px 0", md: "20px 0" },
          position: "relative",
          zIndex: 1,
          color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
          fontSize: { xs: "0.9rem", md: "1rem" },
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: theme.palette.mode === 'dark' ? colors.grey[200] : colors.grey[800],
              fontSize: { xs: "0.9rem", md: "1rem" },
            }}
          >
            Select Trips to Share:
          </Typography>
        </Box>
        <Select
          multiple
          value={selectedTripIds}
          onChange={handleTripChange}
          color="primary"
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
              {selected.map((tripId) => {
                const trip = selectedTrips.find((trip) => trip.id === tripId);
                return (
                  <Chip
                    key={tripId}
                    label={trip?.trp_name || tripId}
                    variant="outlined"
                    sx={{
                      backgroundColor: colors.primary[theme.palette.mode === 'dark' ? 500 : 600],
                      color: "#fff",
                      borderRadius: "8px",
                      fontWeight: 500,
                      fontSize: "0.8rem",
                      "& .MuiChip-label": {
                        color: "#fff",
                        padding: "4px 8px",
                      },
                    }}
                  />
                );
              })}
            </Box>
          )}
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
          fullWidth
        >
          {selectedTrips.map((trip) => (
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
                },
              }}
            >
              {trip.trp_name}
            </MenuItem>
          ))}
        </Select>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "flex-start",
            gap: 2,
            mt: 3,
            mb: 2
          }}
        >
          <TextField
            label="Bank Name"
            value={bankName}
            onChange={handleBankNameChange}
            fullWidth
            variant="outlined"
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
              "& .MuiInputBase-input": {
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
              },
            }}
          />
          <TextField
            label="Bank Account"
            value={bankAccount}
            onChange={handleBankAccountChange}
            fullWidth
            variant="outlined"
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
              "& .MuiInputBase-input": {
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            marginY: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          <ToggleButtonGroup
            value={selectedLanguage}
            exclusive
            onChange={handleLanguageChange}
            size="small"
            sx={{
              '& .MuiToggleButtonGroup-grouped': {
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(0, 0, 0, 0.15)'}`,
                '&.Mui-selected': {
                  backgroundColor: colors.primary[theme.palette.mode === 'dark' ? 500 : 600],
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: colors.primary[theme.palette.mode === 'dark' ? 600 : 700],
                  }
                },
                '&:not(:first-of-type)': {
                  borderRadius: '8px',
                  marginLeft: '4px',
                },
                '&:first-of-type': {
                  borderRadius: '8px',
                },
                color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[700],
                fontWeight: 500,
                padding: '4px 12px',
              }
            }}
          >
            <ToggleButton value="EN">
              EN
            </ToggleButton>
            <ToggleButton value="KR">
              KR
            </ToggleButton>
            <ToggleButton value="KH">
              KH
            </ToggleButton>
          </ToggleButtonGroup>

          <IconButton
            onClick={handleEditToggle}
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              color: isEditing
                ? colors.greenAccent[theme.palette.mode === 'dark' ? 400 : 600]
                : colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(isEditing ? colors.greenAccent[800] : colors.primary[800], 0.2)
                : alpha(isEditing ? colors.greenAccent[200] : colors.primary[200], 0.2),
              borderRadius: "8px",
              padding: "8px",
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha(isEditing ? colors.greenAccent[800] : colors.primary[800], 0.3)
                  : alpha(isEditing ? colors.greenAccent[200] : colors.primary[200], 0.3),
              }
            }}
          >
            {isEditing ? <SaveIcon /> : <EditIcon />}
          </IconButton>
        </Box>

        {isEditing ? (
          <TextField
            value={editableText}
            onChange={handleTextChange}
            multiline
            rows={15}
            fullWidth
            variant="outlined"
            sx={{
              mt: 2,
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
              "& .MuiInputBase-input": {
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                fontFamily: 'monospace',
              },
            }}
          />
        ) : (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: "10px",
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(colors.primary[900], 0.4)
                : alpha(colors.primary[100], 0.4),
              border: `1px solid ${theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.08)'}`,
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-line",
                color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                fontFamily: 'monospace',
                fontSize: "0.85rem",
                lineHeight: 1.6,
              }}
            >
              {invoiceText}
            </Typography>
          </Box>
        )}
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
          onClick={handleCopyToClipboard}
          variant="outlined"
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          startIcon={<ContentCopyIcon />}
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
          Copy to Clipboard
        </Button>

        <Button
          onClick={onClose}
          variant="contained"
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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
          Close
        </Button>
      </DialogActions>

      <CustomAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </Dialog>
  );
}
