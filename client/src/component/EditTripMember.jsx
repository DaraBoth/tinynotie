import React, { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd"; // New Icon
import { tokens } from "../theme";
import { usePostEditTripMemMutation } from "../api/api";
import CustomAlert from "../component/CustomAlert";

export default function EditTripMem({ triggerTrip, member, trip, group_id }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [triggerEditTripMem, { isLoading }] = usePostEditTripMemMutation();

  // Consolidated state management
  const [state, setState] = useState({
    trpNametoEdit: "",
    trpIDtoEdit: "",
    memberName: [],
    memberID: [],
    isCheckedMember: [],
    isDisable: true,
    selectedPayerId: "",
  });

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  const handleChange = (event) => {
    // Reset state first
    setState((prevState) => ({
      ...prevState,
      memberName: [],
      memberID: [],
      isCheckedMember: [],
      trpIDtoEdit: "",
      selectedPayerId: "",
    }));

    // Then set new values
    const trpNametoEdit = event.target.value;
    const memberName = getMemberName(trpNametoEdit, trip, member);
    const memberID = getMemberID(member, memberName);
    const isCheckedMember = getMemberCheck(memberName, member);
    const trpIDtoEdit = getTripID(trpNametoEdit, trip);
    const selectedTrip = trip.find(t => t.trp_name === trpNametoEdit);
    const selectedPayerId = selectedTrip?.payer_id || "";

    setState((prevState) => ({
      ...prevState,
      trpNametoEdit,
      memberName,
      memberID,
      isCheckedMember,
      trpIDtoEdit,
      selectedPayerId,
      isDisable: false,
    }));
  };

  const handleChangeMemName = (event) => {
    // Reset member-related state first
    setState((prevState) => ({
      ...prevState,
      memberID: [],
      isCheckedMember: [],
    }));

    // Then set new values
    const { value } = event.target;
    const memberName = typeof value === "string" ? value.split(",") : value;
    const memberID = getMemberID(member, memberName);
    const isCheckedMember = getMemberCheck(memberName, member);

    setState((prevState) => ({
      ...prevState,
      memberName,
      memberID,
      isCheckedMember,
    }));
  };

  const handlePayerChange = (event) => {
    const selectedPayerId = event.target.value;

    setState((prevState) => ({
      ...prevState,
      selectedPayerId,
    }));
  };

  const handleEdit = () => {
    triggerEditTripMem({
      trp_id: state.trpIDtoEdit,
      group_id,
      trp_name: state.trpNametoEdit,
      mem_id: JSON.stringify(state.memberID),
      payer_id: state.selectedPayerId,
    })
      .then((response) => {
        if (response?.data?.status) {
          setAlertMessage("Successfully updated trip members.");
          setAlertType("success");
          triggerTrip({ group_id });
        } else {
          setAlertMessage(response?.data?.message || "Failed to update trip members.");
          setAlertType("error");
        }
        setAlertOpen(true);
      })
      .catch(() => {
        setAlertMessage("An error occurred. Please try again.");
        setAlertType("error");
        setAlertOpen(true);
      })
      .finally(() => {
        setState({
          trpNametoEdit: "",
          trpIDtoEdit: "",
          memberName: [],
          memberID: [],
          isCheckedMember: [],
          isDisable: true,
          selectedPayerId: "",
        });
      });
  };

  // Utility functions for getting IDs and names
  const getMemberID = (allMember, selectedMember) =>
    allMember.filter((m) => selectedMember.includes(m.mem_name)).map((m) => m.id);

  const getMemberName = (trp_name, trips, member) => {
    const trip = trips.find((t) => t.trp_name === trp_name);
    if (!trip) return [];
    const memberIDs = JSON.parse(trip.mem_id);
    return member.filter((m) => memberIDs.includes(m.id)).map((m) => m.mem_name);
  };

  const getMemberCheck = (memName, member) =>
    member.map((m) => memName.includes(m.mem_name));

  const getTripID = (trp_name, trips) => {
    const trip = trips.find((t) => t.trp_name === trp_name);
    return trip ? trip.id : "";
  };

  return (
    <React.Fragment>
      <Box
        display="grid"
        gap="20px"
        gridTemplateColumns="repeat(4, 1fr)"
        sx={{
          marginTop: "5px",
          "& > div": { gridColumn: "span 4" },
        }}
      >
        <FormControl variant="standard">
          <InputLabel color="primary">Choose Event</InputLabel>
          <Select
            value={state.trpNametoEdit}
            onChange={handleChange}
            label="Choose Event"
            color="primary"
            sx={{ width: "100%" }}
            MenuProps={{
              disablePortal: false,
              slotProps: {
                paper: {
                  sx: {
                    zIndex: 9999
                  }
                }
              }
            }}
          >
            {trip?.map((item) => (
              <MenuItem
                key={item.id}
                value={item.trp_name}
              >
                {item.trp_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="standard" disabled={state.isDisable}>
          <InputLabel color="primary">Member</InputLabel>
          <Select
            multiple
            value={state.memberName}
            onChange={handleChangeMemName}
            label="Member"
            color="primary"
            renderValue={(selected) => selected.join(", ")}
            sx={{ width: "100%" }}
            MenuProps={{
              disablePortal: false,
              slotProps: {
                paper: {
                  sx: {
                    zIndex: 9999
                  }
                }
              }
            }}
          >
            {member.map((item, index) => (
              <MenuItem
                key={item.id}
                value={item.mem_name}
              >
                <Checkbox checked={state.isCheckedMember[index]} />
                <ListItemText primary={item.mem_name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="standard" disabled={state.isDisable}>
          <InputLabel color="primary">Who paid?</InputLabel>
          <Select
            value={state.selectedPayerId}
            onChange={handlePayerChange}
            label="Who paid?"
            color="primary"
            sx={{ width: "100%" }}
            MenuProps={{
              disablePortal: false,
              slotProps: {
                paper: {
                  sx: {
                    zIndex: 9999
                  }
                }
              }
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {member.map((item) => (
              <MenuItem
                key={item.id}
                value={item.id.toString()}
              >
                {item.mem_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          sx={{ gridColumn: "span 4" }}
          onClick={handleEdit}
          type="button"
          color="primary"
          variant="contained"
          startIcon={isLoading ? <CircularProgress size="1rem" /> : <GroupAddIcon />} // New Icon
          disabled={isLoading || state.isDisable}
        >
          {isLoading ? "Updating..." : "Update Members"}  {/* New Button Label */}
        </Button>
      </Box>

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
