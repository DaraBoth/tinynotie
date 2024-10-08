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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CustomAlert from "./CustomAlert";
import { tokens } from "../theme";
import currency from "currency.js";

export default function ShareModal({
  open,
  onClose,
  selectedTrips,
  currencyType,
  member,
}) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

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
        thankYou: "Thank you for your cooperation!",
      },
      KR: {
        bankDetails: `${bankName}\n${bankAccount}\n\n`,
        greeting: "안녕하세요!\n이것은 영수증입니다.\n\n",
        totalAmount: "총 금액",
        participants: "참여 멤버",
        perMember: "1인당 금액",
        eachPersonPays: "각 사람의 지불 금액",
        thankYou: "협조해 주셔서 감사합니다!",
      },
      KH: {
        bankDetails: `${bankName}\n${bankAccount}\n\n`,
        greeting: "សួស្ដី!\nនេះគឺជាវិក័យប័ត្រ។\n\n",
        totalAmount: "ចំនួន​សរុប",
        participants: "អ្នក​ចូលរួម",
        perMember: "ចំណាយតាមម្នាក់",
        eachPersonPays: "ការទូទាត់តាមម្នាក់",
        thankYou: "អរគុណសម្រាប់កិច្ចសហការរបស់អ្នក!",
      },
    };

    const t = translations[language];
    let totalPerMember = {};

    const tripDetails = trips
      .map((trip) => {
        const members = JSON.parse(trip.mem_id).map((memId) => {
          const memberName = member.find((m) => m.id === memId)?.mem_name;
          return memberName;
        });

        const perMemberAmount = currency(trip.spend / members.length, {
          symbol: currencyType,
        }).format();

        members.forEach((mem) => {
          if (!totalPerMember[mem]) {
            totalPerMember[mem] = 0;
          }
          totalPerMember[mem] += trip.spend / members.length;
        });

        return `${trip.trp_name}\n${t.totalAmount}: ${currency(trip.spend, {
          symbol: currencyType,
        }).format()}\n${t.participants}: ${members.join(", ")}\n${
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
      PaperProps={{
        sx: {
          backgroundColor: colors.background,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: "18px",
          color: colors.primary[500],
        }}
      >
        Share Invoice
      </DialogTitle>
      <DialogContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="body1"
            sx={{ fontWeight: "bold", mb: 1, color: colors.primary[500] }}
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
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((tripId) => {
                const trip = selectedTrips.find((trip) => trip.id === tripId);
                return (
                  <Chip
                    key={tripId}
                    label={trip?.trp_name || tripId}
                    variant="outlined"
                    sx={{
                      backgroundColor: colors.primary[500],
                      color: "#fff",
                      "& .MuiChip-label": {
                        color: "#fff",
                      },
                    }}
                  />
                );
              })}
            </Box>
          )}
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
          fullWidth
        >
          {selectedTrips.map((trip) => (
            <MenuItem
              key={trip.id}
              value={trip.id}
              sx={{
                backgroundColor: selectedTripIds.includes(trip.id)
                  ? colors.primary[500]
                  : "inherit",
                color: selectedTripIds.includes(trip.id)
                  ? "#fff"
                  : colors.primary[600],
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
              {trip.trp_name}
            </MenuItem>
          ))}
        </Select>

        <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
          <TextField
            label="Bank Name"
            value={bankName}
            onChange={handleBankNameChange}
            fullWidth
            variant="outlined"
            sx={{
              mr: 1,
              "& .MuiInputBase-input": {
                color: colors.primary[600],
              },
              "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[400],
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[500],
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
              "& .MuiInputBase-input": {
                color: colors.primary[600],
              },
              "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[400],
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[500],
              },
            }}
          />
        </Box>

        <Box
          display="flex"
          width={"100%"}
          justifyContent="center"
          sx={{ marginY: 2 }}
        >
          <Box
            display="flex"
            width={"100%"}
            flexDirection={"row"}
            alignItems="center"
            justifyContent="space-between"
          >
            <ToggleButtonGroup
              value={selectedLanguage}
              exclusive
              onChange={handleLanguageChange}
              sx={{ marginRight: 2 }}
              size="small"
            >
              <ToggleButton value="EN" sx={{ color: colors.primary[500] }}>
                EN
              </ToggleButton>
              <ToggleButton value="KR" sx={{ color: colors.primary[500] }}>
                KR
              </ToggleButton>
              <ToggleButton value="KH" sx={{ color: colors.primary[500] }}>
                KH
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton
              onClick={handleEditToggle}
              color={isEditing ? "secondary" : "info"}
            >
              {isEditing ? <SaveIcon /> : <EditIcon />}
            </IconButton>
          </Box>
        </Box>

        {isEditing ? (
          <TextField
            value={editableText}
            onChange={handleTextChange}
            multiline
            rows={15}
            fullWidth
            sx={{
              mt: 2,
              "& .MuiInputBase-input": {
                color: colors.primary[600],
              },
              "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[400],
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: colors.primary[500],
              },
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-line", mb: 2, color: colors.primary[600] }}
          >
            {invoiceText}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleCopyToClipboard}
          variant="outlined"
          color="secondary"
          startIcon={<ContentCopyIcon />}
        >
          Copy to Clipboard
        </Button>
        <Button onClick={onClose} variant="outlined" color="secondary">
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
