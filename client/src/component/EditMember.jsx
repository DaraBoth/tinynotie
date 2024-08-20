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
  usePostAddMemberMutation,
  usePostEditMemberMutation,
} from "../api/api";
import {
  Box,
  CircularProgress,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { tokens } from "../theme";
import CustomAlert from "../component/CustomAlert"; // Import CustomAlert component

const filter = createFilterOptions();

export default function EditMember({ triggerMember, member, group_id }) {
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);
  const [triggerAddMember, resultAddMember] = usePostAddMemberMutation();
  const [triggerEditMember, resultEditMember] = usePostEditMemberMutation();
  const [money, setMoney] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState('');
  const [alertType, setAlertType] = React.useState('success'); // success, error, warning, info
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
            setAlertMessage('Transaction successful!');
            setAlertType('success');
          } else {
            setAlertMessage(`Transaction failed: ${response?.data?.message}`);
            setAlertType('error');
          }
          setAlertOpen(true);
        })
        .finally(() => {
          setLoading(false);
          setValue(null);
          setMoney("");
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
          setAlertMessage('Member added successfully!');
          setAlertType('success');
        } else {
          setAlertMessage(`Failed to add member: ${response?.data?.message}`);
          setAlertType('error');
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
          <DialogTitle>Add a Member</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please fill out the new member's details.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="mem_name"
              color="info"
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
              color="info"
              value={dialogValue.paid}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  paid: event.target.value,
                })
              }
              label="Paid"
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
