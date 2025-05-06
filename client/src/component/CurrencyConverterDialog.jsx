import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  CircularProgress,
  useTheme,
  IconButton,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { tokens } from "../theme";
import {
  convertCurrency,
  getCurrencySymbol,
  getCurrencyName,
  getCommonCurrencies,
} from "../utils/currencyConverter";

const CurrencyConverterDialog = ({
  open,
  onClose,
  initialAmount,
  initialFromCurrency,
  onConversionComplete,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [amount, setAmount] = useState(initialAmount || "");
  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency || "AUD");
  const [toCurrency, setToCurrency] = useState("KRW");
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  
  const commonCurrencies = getCommonCurrencies();

  useEffect(() => {
    setAmount(initialAmount || "");
    setFromCurrency(initialFromCurrency || "AUD");
  }, [initialAmount, initialFromCurrency, open]);

  const handleConvert = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const result = await convertCurrency(
        parseFloat(amount),
        fromCurrency,
        toCurrency
      );
      
      setConvertedAmount(result.amount);
      setConversionRate(result.rate);
      setLoading(false);
    } catch (error) {
      setError("Failed to convert currency. Please try again.");
      setLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setConvertedAmount(null);
    setConversionRate(null);
  };

  const handleCopyToClipboard = () => {
    if (convertedAmount) {
      navigator.clipboard.writeText(convertedAmount.toFixed(2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseConverted = () => {
    if (convertedAmount && onConversionComplete) {
      onConversionComplete(convertedAmount.toFixed(2), toCurrency);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: colors.background,
          width: "100%",
          maxWidth: "400px",
        },
      }}
    >
      <DialogTitle sx={{ color: colors.primary[500] }}>
        Currency Converter
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Amount"
            variant="standard"
            type="text"
            value={amount}
            onChange={(e) => {
              const value = e.target.value.trim();
              if (!isNaN(Number(value)) || value === "" || value === ".") {
                setAmount(value);
                setConvertedAmount(null);
                setConversionRate(null);
              }
            }}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                color: colors.primary[600],
              },
              "& .MuiInputLabel-root": {
                color: colors.primary[500],
              },
            }}
          />

          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <FormControl variant="standard" fullWidth sx={{ mr: 1 }}>
              <InputLabel sx={{ color: colors.primary[500] }}>From</InputLabel>
              <Select
                value={fromCurrency}
                onChange={(e) => {
                  setFromCurrency(e.target.value);
                  setConvertedAmount(null);
                  setConversionRate(null);
                }}
                sx={{
                  "& .MuiSelect-select": {
                    color: colors.primary[600],
                  },
                  "& .MuiSelect-icon": {
                    color: colors.primary[500],
                  },
                }}
              >
                {commonCurrencies.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {getCurrencySymbol(currency)} - {getCurrencyName(currency)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <IconButton
              onClick={handleSwapCurrencies}
              sx={{ color: colors.primary[500] }}
            >
              <SwapHorizIcon />
            </IconButton>

            <FormControl variant="standard" fullWidth sx={{ ml: 1 }}>
              <InputLabel sx={{ color: colors.primary[500] }}>To</InputLabel>
              <Select
                value={toCurrency}
                onChange={(e) => {
                  setToCurrency(e.target.value);
                  setConvertedAmount(null);
                  setConversionRate(null);
                }}
                sx={{
                  "& .MuiSelect-select": {
                    color: colors.primary[600],
                  },
                  "& .MuiSelect-icon": {
                    color: colors.primary[500],
                  },
                }}
              >
                {commonCurrencies.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {getCurrencySymbol(currency)} - {getCurrencyName(currency)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Button
            variant="contained"
            onClick={handleConvert}
            disabled={loading}
            fullWidth
            sx={{
              backgroundColor: colors.primary[500],
              color: "#fff",
              "&:hover": {
                backgroundColor: colors.primary[600],
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : "Convert"}
          </Button>

          {error && (
            <Typography
              variant="body2"
              sx={{ color: colors.redAccent[500], mt: 1 }}
            >
              {error}
            </Typography>
          )}

          {convertedAmount !== null && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: colors.primary[400],
                borderRadius: "4px",
                position: "relative",
              }}
            >
              <Typography variant="body2" sx={{ color: colors.grey[100], mb: 1 }}>
                Conversion Result:
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h5" sx={{ color: "#fff" }}>
                  {getCurrencySymbol(toCurrency)} {convertedAmount.toFixed(2)}
                </Typography>
                <IconButton
                  onClick={handleCopyToClipboard}
                  size="small"
                  sx={{ color: "#fff" }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
              {copied && (
                <Typography
                  variant="caption"
                  sx={{ color: colors.greenAccent[400], mt: 0.5, display: "block" }}
                >
                  Copied to clipboard!
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: colors.grey[300], mt: 1, display: "block" }}>
                Exchange Rate: 1 {getCurrencySymbol(fromCurrency)} = {conversionRate.toFixed(4)} {getCurrencySymbol(toCurrency)}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{ color: colors.primary[500] }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUseConverted}
          disabled={convertedAmount === null}
          sx={{
            color: colors.primary[500],
            fontWeight: "bold",
          }}
        >
          Use Converted Value
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CurrencyConverterDialog;
