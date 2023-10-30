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
  usePostEditMemberMutation,
  usePostEditTripMutation,
} from "../api/api";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { tokens } from "../theme";
import { rspWidth } from "../responsive";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
const filter = createFilterOptions();

export default function AddTrip({
  triggerTrip,
  member,
  secret,
  trip,
  group_id,
}) {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);
  const [triggerAddTrip, resultAddTrip] = usePostAddTripMutation();
  const [triggerEditTrip, resultEditTrip] = usePostEditTripMutation();
  const [money, setMoney] = React.useState(null);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [expanded, setExpanded] = React.useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleFont = () => {
    return rspWidth("1.2rem", "1rem", "1rem");
  };

  const handleClose = () => {
    setDialogValue({
      trp_name: "",
      spended: "",
    });
    toggleOpen(false);
  };

  const [dialogValue, setDialogValue] = React.useState({
    trp_name: "",
    spended: "",
  });

  const handleEdit = () => {
    triggerEditTrip({
      trp_name: value.trp_name,
      spend: parseFloat(money),
      group_id,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setValue({
      trp_name: dialogValue.trp_name,
      spended: dialogValue.spended,
    });
    triggerAddTrip({
      trp_name: dialogValue.trp_name,
      spend: dialogValue.spended,
      admn_id: secret,
      mem_id: JSON.stringify(convertMemKeyToArray(member, "id")),
      discription: "",
      group_id,
    });
    handleClose();
  };

  React.useEffect(() => {
    if (resultAddTrip.data?.status || resultEditTrip.data?.status) {
      triggerTrip({ group_id });
    }
    if (resultAddTrip.data?.status === false) {
      alert(resultAddTrip.data?.message);
    }
    if (resultEditTrip.data?.status === false) {
      alert(resultEditTrip.data?.message);
    }
  }, [resultAddTrip, resultEditTrip]);

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
        <Accordion
          variant="outlined"
          expanded={expanded === "panel1"}
          onChange={handleChange("panel1")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
          >
            <Typography fontSize={handleFont} sx={{ flexShrink: 0 }}>
              Edit Event's information
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
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
                // e.g value selected with enter, right from the input
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
                  color="info"
                  {...params}
                  variant="standard"
                  label="Edit Event"
                />
              )}
            />

            <TextField
              variant="standard"
              type="number"
              label="$ Spend"
              color="info"
              value={money}
              onChange={(e) => {
                setMoney(e.target.value);
              }}
            />
            <Button
              sx={{ gridColumn: "span 4" }}
              onClick={handleEdit}
              type="button"
              color="info"
              variant="outlined"
            >
              Edit Event's Spend&nbsp;
              <SendIcon />
            </Button>
          </AccordionDetails>
        </Accordion>
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <form
          onSubmit={handleSubmit}
          style={{ backgroundColor: colors.primary[400] }}
        >
          <DialogTitle>Add a event</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please help fill out new event and spended money.
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
              label="Trip's name"
              type="text"
              variant="standard"
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
            />
          </DialogContent>
          <DialogActions>
            <Button color="info" variant="standard" onClick={handleClose}>
              Cancel
            </Button>
            <Button color="info" variant="standard" type="submit">
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>
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
