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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SaveIcon from "@mui/icons-material/Save";
import { tokens } from "../theme";
import CustomAlert from "../component/CustomAlert"; // Import CustomAlert component

const filter = createFilterOptions();

export default function EditMember({ triggerMember, member, group_id, currencyType }) {
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);
  const [triggerAddMember, resultAddMember] = usePostAddMemberMutation();
  const [triggerEditMember, resultEditMember] = usePostEditMemberMutation();
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
        type, // "ADD" or "REDUCE"
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
          setSelectedChip(null); // Reset selected chip
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
          marginBottom: "10px",
        }}
      >
        <Autocomplete
          value={value}
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              setTimeout(() => {
                toggleOpen(true);
                setDialogValue({
                  mem_name: newValue,
                  paid: "",
                });
              });
            } else if (newValue && newValue.inputValue) {
              toggleOpen(true);
              setDialogValue({
                mem_name: newValue.inputValue,
                paid: "",
              });
            } else {
              setValue(newValue);
              setMoney(newValue.paid);
              setSelectedChip(currencySuggestions[currencyType][0]);
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            if (params.inputValue !== "") {
              filtered.push({
                inputValue: params.inputValue,
                mem_name: `Add "${params.inputValue}"`,
              });
            }

            return filtered;
          }}
          options={member}
          getOptionLabel={(option) => {
            if (typeof option === "string") {
              return option;
            }
            if (option.inputValue) {
              return option.inputValue;
            }
            return option.mem_name;
          }}
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          renderOption={(props, option) => (
            <li {...props}>{option.mem_name}</li>
          )}
          freeSolo
          renderInput={(params) => (
            <TextField
              color="primary"
              {...params}
              variant="standard"
              label="Edit Member"
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
          <DialogTitle>New member</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="mem_name"
              color="secondary"
              value={dialogValue.mem_name}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  mem_name: event.target.value,
                })
              }
              label="Member's Name"
              type="text"
              variant="standard"
              fullWidth
            />
            <TextField
              margin="dense"
              id="paid"
              color="secondary"
              value={dialogValue.paid}
              onChange={(e) => {
                e.target.value = e.target.value.trim();
                if (isNaN(Number(e.target.value)) && e.target.value !== ".") return;
                setDialogValue({
                  ...dialogValue,
                  paid: e.target.value,
                });
              }}
              label="Paid"
              type="text"
              variant="standard"
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ display: "flex", flexDirection: "row" }}>
            <Button
              color="error"
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
