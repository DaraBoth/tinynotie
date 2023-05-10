import * as React from 'react';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { usePostAddMemberMutation, usePostEditMemberMutation } from '../api/api';
import { Box, Fab, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { tokens } from '../theme'
const filter = createFilterOptions();

export default function ToolTip({ triggerMember, member, group_id, trip_id }) {
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);
  const [triggerAddMember, resultAddMember] = usePostAddMemberMutation();
  const [triggerEditMember, resultEditMember] = usePostEditMemberMutation();
  const [money, setMoney] = React.useState(null);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleClose = () => {
    setDialogValue({
      mem_name: '',
      paid: '',
    });
    toggleOpen(false);
  };

  const [dialogValue, setDialogValue] = React.useState({
    mem_name: '',
    paid: '',
  });

  const handleEdit = () => {
    triggerEditMember({ user_id: value.id, paid: money })
  }

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
    })
    handleClose();
  };

  React.useEffect(() => {
    if (resultAddMember.data?.status) {
      triggerMember({ group_id })
    }
  }, [resultAddMember])

  React.useEffect(() => {
    if (resultAddMember.data?.status || resultEditMember.data?.status) {
      triggerMember({ group_id })
    }
  }, [resultAddMember, resultEditMember])

  return (
    <React.Fragment>
      <Box
        display={'flex'}
        flexDirection={'row'}
        justifyContent={'center'}
        flexWrap={'wrap'}
        gap={'10px'}
      >
        <Autocomplete
          style={{ flex: '2' }}
          value={value}
          onChange={(event, newValue) => {
            if (typeof newValue === 'string') {
              // timeout to avoid instant validation of the dialog's form.
              setTimeout(() => {
                toggleOpen(true);
                setDialogValue({
                  mem_name: newValue,
                  paid: '',
                });
              });
            } else if (newValue && newValue.inputValue) {
              toggleOpen(true);
              setDialogValue({
                mem_name: newValue.inputValue,
                paid: '',
              });
            } else {
              setValue(newValue);
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            if (params.inputValue !== '') {
              filtered.push({
                inputValue: params.inputValue,
                mem_name: `Add "${params.inputValue}"`,
              });
            }

            return filtered;
          }}
          id="free-solo-dialog-demo"
          options={member}
          getOptionLabel={(option) => {
            // e.g value selected with enter, right from the input
            if (typeof option === 'string') {
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
          renderOption={(props, option) => <li {...props}>{option.mem_name}</li>}
          sx={{ width: 300 }}
          freeSolo
          renderInput={(params) => <TextField color="info" {...params} variant='standard' label="Edit Member" />}
        />
        <TextField
          style={{ flex: '1' }}
          variant='standard'
          type="number"
          label="$ Paid"
          color="info"
          value={money}
          onChange={(e) => {
            setMoney(e.target.value)
          }}
        />
        <Button onClick={handleEdit} type="button" color="info" variant='standard' >
          <SendIcon />
        </Button>
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={handleSubmit}
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
            <Button color="info" variant="standard" onClick={handleClose}>Cancel</Button>
            <Button color="info" variant="standard" type="submit">Add</Button>
          </DialogActions>
        </form>
      </Dialog>
    </React.Fragment>
  );
}
