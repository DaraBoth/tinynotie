import React, { useState, useEffect } from 'react';
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
  OutlinedInput,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CustomAlert from './CustomAlert'; // Import CustomAlert component
import currency from 'currency.js';

export default function ShareModal({ open, onClose, selectedTrips, currencyType, member }) {
  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [invoiceText, setInvoiceText] = useState('');
  const [editableText, setEditableText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN'); // Default to English
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  useEffect(() => {
    if (selectedTrips.length) {
      setSelectedTripIds(selectedTrips.map(trip => trip.id));
      generateInvoiceText(selectedTrips, selectedLanguage);
    }
  }, [selectedTrips, selectedLanguage]);

  const handleTripChange = (event) => {
    const selectedIds = event.target.value;
    setSelectedTripIds(selectedIds);
    const selected = selectedIds.map(id => selectedTrips.find(trip => trip.id === id));
    generateInvoiceText(selected, selectedLanguage);
  };

  const handleLanguageChange = (event, newLanguage) => {
    if (newLanguage) {
      setSelectedLanguage(newLanguage);
      generateInvoiceText(selectedTrips, newLanguage);
    }
  };

  const generateInvoiceText = (trips, language) => {
    const translations = {
      EN: {
        bankDetails: "[Bank name] - Toss Bank\n[XXXX-XXXX-XXXX]\n\n",
        greeting: "Hello!\nThis is your receipt.\n",
        totalAmount: "Total Amount",
        participants: "Participants",
        perMember: "Per Member",
        eachPersonPays: "Each Person Pays",
        thankYou: "Thank you for your cooperation!",
      },
      KR: {
        bankDetails: "[은행 이름] - 토스뱅크\n[XXXX-XXXX-XXXX]\n\n",
        greeting: "안녕하세요!\n이것은 영수증입니다.\n",
        totalAmount: "총 금액",
        participants: "참여 멤버",
        perMember: "1인당 금액",
        eachPersonPays: "각 사람의 지불 금액",
        thankYou: "협조해 주셔서 감사합니다!",
      },
      KH: {
        bankDetails: "[ឈ្មោះធនាគារ] - ទោសបេ​ង់\n[XXXX-XXXX-XXXX]\n\n",
        greeting: "សួស្ដី!\nនេះគឺជាវិក័យប័ត្រ។\n",
        totalAmount: "ចំនួន​សរុប",
        participants: "អ្នក​ចូលរួម",
        perMember: "ចំណាយតាមម្នាក់",
        eachPersonPays: "ការទូទាត់តាមម្នាក់",
        thankYou: "អរគុណសម្រាប់កិច្ចសហការរបស់អ្នក!",
      }
    };

    const t = translations[language];
    let totalPerMember = {};

    const tripDetails = trips.map(trip => {
      const members = JSON.parse(trip.mem_id).map(memId => {
        const memberName = member.find(m => m.id === memId)?.mem_name;
        return memberName;
      });

      const perMemberAmount = currency(trip.spend / members.length, { symbol: currencyType }).format();

      // Accumulate total spend per member
      members.forEach(mem => {
        if (!totalPerMember[mem]) {
          totalPerMember[mem] = 0;
        }
        totalPerMember[mem] += trip.spend / members.length;
      });

      return `${trip.trp_name}\n${t.totalAmount}: ${currency(trip.spend, { symbol: currencyType }).format()}\n${t.participants}: ${members.join(", ")}\n${t.perMember}: ${perMemberAmount}\n\n`;
    }).join('');

    const totalSpend = trips.reduce((acc, trip) => acc + trip.spend, 0);

    // Formatting the total amount each member needs to pay
    const perPersonDetail = Object.entries(totalPerMember).map(([name, amount]) => {
      return `${name}: ${currency(amount, { symbol: currencyType }).format()}`;
    }).join("\n");

    const summary = `${t.totalAmount}: ${currency(totalSpend, { symbol: currencyType }).format()}\n${t.eachPersonPays}:\n${perPersonDetail}\n\n${t.thankYou}`;

    const fullText = t.bankDetails + t.greeting + tripDetails + summary;
    setInvoiceText(fullText);
    setEditableText(fullText);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(invoiceText).then(() => {
      setAlertMessage('Copied to clipboard!');
      setAlertType('success');
      setAlertOpen(true);
    }).catch(() => {
      setAlertMessage('Failed to copy!');
      setAlertType('error');
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: "18px" }}>Share Invoice</DialogTitle>
      <DialogContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>Select Trips to Share:</Typography>
        </Box>
        <Select
          multiple
          value={selectedTripIds}
          onChange={handleTripChange}
          input={<OutlinedInput label="Trips" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((tripId) => {
                const trip = selectedTrips.find(trip => trip.id === tripId);
                return <Chip key={tripId} label={trip?.trp_name || tripId} variant='outlined' />;
              })}
            </Box>
          )}
          fullWidth
        >
          {selectedTrips.map((trip) => (
            <MenuItem key={trip.id} value={trip.id}>
              {trip.trp_name}
            </MenuItem>
          ))}
        </Select>

        <Box display="flex" width={"100%"} justifyContent="center" sx={{ marginY: 2 }}>
          <Box display="flex" width={"100%"} flexDirection={"row"} alignItems="center" justifyContent="space-between">
            <ToggleButtonGroup
              value={selectedLanguage}
              exclusive
              onChange={handleLanguageChange}
              sx={{ marginRight: 2 }}
              size='small'
            >
              <ToggleButton value="EN">EN</ToggleButton>
              <ToggleButton value="KR">KR</ToggleButton>
              <ToggleButton value="KH">KH</ToggleButton>
            </ToggleButtonGroup>
            <IconButton onClick={handleEditToggle} color={isEditing ? "secondary" : "info"} >
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
            sx={{ mt: 2 }}
          />
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
            {invoiceText}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCopyToClipboard} variant="outlined" color="secondary" startIcon={<ContentCopyIcon />}>
          Copy to Clipboard
        </Button>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Close
        </Button>
      </DialogActions>

      {/* Custom Alert for feedback */}
      <CustomAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </Dialog>
  );
}
