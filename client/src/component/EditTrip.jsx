import * as React from "react";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import {
  usePostAddTripMutation,
  usePostEditTripMutation,
} from "../api/api";
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { tokens } from "../theme";
import CustomAlert from "./CustomAlert"; // Import the CustomAlert component
import moment from "moment"

const filter = createFilterOptions();

export default function AddTrip({
  triggerTrip,
  member,
  secret,
  trip,
  group_id,
}) {
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);
  const [triggerAddTrip, resultAddTrip] = usePostAddTripMutation();
  const [triggerEditTrip, resultEditTrip] = usePostEditTripMutation();
  const [money, setMoney] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState('');
  const [alertType, setAlertType] = React.useState('success'); // success, error, warning, info
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
        type,  // "ADD" or "REDUCE"
      })
        .then((response) => {
          if (response?.data?.status) {
            setAlertMessage(response?.data?.message);
            setAlertType('success');
          } else {
            setAlertMessage(response?.data?.message);
            setAlertType('error');
          }
          setAlertOpen(true);
        })
        .finally(() => {
          setLoading(false);
          setValue(null);
          setMoney("");
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
          setAlertMessage('Trip added successfully!');
          setAlertType('success');
        } else {
          setAlertMessage(`Failed to add trip: ${response?.data?.message}`);
          setAlertType('error');
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
    if (resultEditTrip.data?.status) {
      triggerTrip({ group_id });
      handleClose();
    }
  }, [resultEditTrip]);

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
              label="Select or Add Event"
            />
          )}
        />

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
        />

        <Box display="flex" justifyContent="space-between" sx={{ mt: 2 }}>
          <Button
            onClick={() => handleTransaction("REDUCE")}
            color="secondary"
            variant="contained"
            startIcon={loading && <CircularProgress size={20} />}
            disabled={loading}
            sx={{ flex: 1, mr: 1 }}
          >
            <RemoveIcon />
            Reduce
          </Button>
          <Button
            onClick={() => handleTransaction("ADD")}
            color="primary"
            variant="contained"
            startIcon={loading && <CircularProgress size={20} />}
            disabled={loading}
            sx={{ flex: 1, ml: 1 }}
          >
            <AddIcon />
            Add
          </Button>
        </Box>
      </Box>

      <Dialog open={open} onClose={loading ? null : handleClose}>
        <form
          onSubmit={handleSubmit}
          style={{ backgroundColor: colors.primary[400] }}
        >
          <DialogTitle>Add a New Event</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please fill out the new event's details.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="trp_name"
              color="info"
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
              color="info"
              value={dialogValue.spended}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  spended: event.target.value,
                })
              }
              label="Spend"
              type="number"
              variant="standard"
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button
              color="info"
              variant="outlined"
              onClick={loading ? null : handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              color="info"
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
