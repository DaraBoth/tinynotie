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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Fab,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { tokens } from "../theme";
import { rspWidth } from "../responsive";
const filter = createFilterOptions();

export default function ToolTip({ triggerMember, member, group_id, trip_id }) {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);
  const [triggerAddMember, resultAddMember] = usePostAddMemberMutation();
  const [triggerEditMember, resultEditMember] = usePostEditMemberMutation();
  const [money, setMoney] = React.useState(null);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [expanded, setExpanded] = React.useState(false);

  const handleChange =
    (panel) => (event, isExpanded) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleFont = () => {
    return rspWidth("1.2rem", "1rem", "1rem");
  };

  const handleClose = () => {
    setDialogValue({
      mem_name: "",
      paid: "",
    });
    setValue("")
    toggleOpen(false);
  };

  const [dialogValue, setDialogValue] = React.useState({
    mem_name: "",
    paid: "",
  });

  const handleEdit = () => {
    triggerEditMember({ user_id: value.id, paid: money });
    setValue("")
    setMoney(0)
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setValue({
      mem_name: dialogValue.mem_name,
      paid: dialogValue.paid,
    });
    triggerAddMember({
      mem_name: dialogValue.mem_name,
      paid: dialogValue.paid,
      group_id,
    });
    handleClose();
  };

  React.useEffect(() => {
    if (resultAddMember.data?.status) {
      triggerMember({ group_id });
    }
  }, [resultAddMember]);

  React.useEffect(() => {
    if (resultAddMember.data?.status || resultEditMember.data?.status) {
      triggerMember({ group_id });
    }
  }, [resultAddMember, resultEditMember]);

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
        <Accordion
          variant="outlined"
          expanded={expanded === "panel2"}
          onChange={handleChange("panel2")}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2bh-content"
            id="panel2bh-header"
          >
            <Typography fontSize={handleFont} sx={{ flexShrink: 0 }}>Edit Member's information</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              display:"flex",
              flexDirection:"column",
              gap:"10px"
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
                // e.g value selected with enter, right from the input
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
                  color="info"
                  {...params}
                  variant="standard"
                  label="Edit Member"
                />
              )}
            />
            <TextField
              variant="standard"
              type="number"
              label="$ Paid"
              color="info"
              value={money}
              // InputProps={}
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
              Edit Member's paid&nbsp;
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
          <DialogTitle>Add a member</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please help fill out new member's name and their paid money.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              color="info"
              value={dialogValue.mem_name}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  mem_name: event.target.value,
                })
              }
              label="Name"
              type="text"
              variant="standard"
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
