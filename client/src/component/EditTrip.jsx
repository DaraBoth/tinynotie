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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import RemoveIcon from "@mui/icons-material/Remove";
import { tokens } from "../theme";
import CustomAlert from "./CustomAlert"; // Import the CustomAlert component
import moment from "moment";

const filter = createFilterOptions();

export default function EditTrip({
  triggerTrip,
  member,
  secret,
  trip,
  group_id,
  currencyType, // New prop for currency type
}) {
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);
  const [triggerAddTrip, resultAddTrip] = usePostAddTripMutation();
  const [triggerEditTrip, resultEditTrip] = usePostEditTripMutation();
  const [money, setMoney] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertType, setAlertType] = React.useState("success"); // success, error, warning, info
  const [selectedChip, setSelectedChip] = React.useState(null); // State to track the selected chip
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleClose = () => {
    setDialogValue({
      trp_name: "",
      spended: "",
    });
    setValue("");
    setMoney("");
    toggleOpen(false);
  };

  const [dialogValue, setDialogValue] = React.useState({
    trp_name: "",
    spended: "",
  });

  const handleTransaction = (type) => {
    if (!!value?.trp_name && !isNaN(parseFloat(money))) {
      setLoading(true);
      const adjustedMoney = parseFloat(money);

      triggerEditTrip({
        trp_name: value.trp_name,
        spend: adjustedMoney,
        group_id,
        update_dttm: moment().format("YYYY-MM-DD HH:mm:ss"),
        type, // "ADD" or "REDUCE"
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
          setSelectedChip(null); // Reset selected chip
        });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    triggerAddTrip({
      trp_name: dialogValue.trp_name,
      spend: parseFloat(dialogValue.spended),
      admn_id: secret,
      mem_id: JSON.stringify(convertMemKeyToArray(member, "id")),
      description: "",
      group_id,
      create_date: moment().format("YYYY-MM-DD HH:mm:ss"),
      update_dttm: moment().format("YYYY-MM-DD HH:mm:ss"),
      type: "ADD", // Default to ADD when creating a new trip
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
  }, [resultEditTrip,resultAddTrip]);

  // Predefined amounts based on currency type
  const currencySuggestions = {
    $: [5, 10, 20, 50, 100],
    W: [1000, 5000, 10000, 50000, 100000],
    R: [2000, 5000, 10000, 20000, 50000],
  };

  const handleChipClick = (amount) => {
    setSelectedChip(amount); // Select the chip but don't add to input
  };

  const handleAddClick = () => {
    if (selectedChip !== null) {
      setMoney((prev) => (parseFloat(prev || 0) + selectedChip).toString());
    }
  };

  const handleSubtractClick = () => {
    if (selectedChip !== null) {
      setMoney((prev) => Math.max(0, parseFloat(prev || 0) - selectedChip).toString());
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
        <Autocomplete
          value={value}
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              setTimeout(() => {
                toggleOpen(true);
                setDialogValue({
                  trp_name: newValue,
                  spended: "",
                });
              });
            } else if (newValue && newValue.inputValue) {
              toggleOpen(true);
              setDialogValue({
                trp_name: newValue.inputValue,
                spended: "",
              });
            } else {
              setValue(newValue);
              setMoney(newValue.spend)
              setSelectedChip(currencySuggestions[currencyType][0]);
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            if (params.inputValue !== "") {
              filtered.push({
                inputValue: params.inputValue,
                trp_name: `Add "${params.inputValue}"`,
              });
            }

            return filtered;
          }}
          options={trip}
          getOptionLabel={(option) => {
            if (typeof option === "string") {
              return option;
            }
            if (option.inputValue) {
              return option.inputValue;
            }
            return option.trp_name;
          }}
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          renderOption={(props, option) => (
            <li {...props}>{option.trp_name}</li>
          )}
          freeSolo
          renderInput={(params) => (
            <TextField
              color="primary"
              {...params}
              variant="standard"
              label="Select or Add Trip"
            />
          )}
        />

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
            sx={{ flex: 1 }}
          />
          <IconButton
            onClick={handleSubtractClick}
            color="secondary"
            disabled={loading || selectedChip === null}
          >
            <RemoveIcon />
          </IconButton>
          <IconButton
            onClick={handleAddClick}
            color="primary"
            disabled={loading || selectedChip === null}
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Box display="flex" flexWrap="wrap" sx={{ mt: 1 }}>
          {currencySuggestions[currencyType]?.map((amount, index) => (
            <Chip
              key={index}
              label={`${currencyType}${amount}`}
              onClick={() => handleChipClick(amount)}
              color={selectedChip === amount ? "primary" : "default"} // Highlight selected chip
              sx={{ m: 0.5 }}
            />
          ))}
        </Box>

        <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
        <Button
            onClick={() => handleTransaction("UPDATE")}
            color="primary"
            variant="contained"
            startIcon={loading && <CircularProgress size={20} />}
            disabled={loading || !value}
            sx={{ flex: 1, ml: 1 }}
          >
            <SaveIcon />
            Save
          </Button>
        </Box>
      </Box>

      <Dialog open={open} onClose={loading ? null : handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>New trip</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="trp_name"
              color="secondary"
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
            />
            <TextField
              margin="dense"
              id="spended"
              color="secondary"
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
            />
          </DialogContent>
          <DialogActions>
            <Button
              color="inherit"
              variant="outlined"
              onClick={loading ? null : handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              variant="contained"
              type="submit"
              startIcon={loading && <CircularProgress size={20} />}
              disabled={loading}
            >
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Custom Alert for feedback */}
      <CustomAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </React.Fragment>
  );
}

function convertMemKeyToArray(member, key) {
  let newArray = [];
  for (let i in member) {
    newArray[i] = member[i][key];
  }
  return newArray;
}
