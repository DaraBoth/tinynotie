import * as React from "react";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { usePostEditTripMemMutation } from "../api/api";
import {
  Box,
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
  useTheme,
  ListItemText,
  Checkbox,
  useMediaQuery,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { tokens } from "../theme";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { rspWidth } from "../responsive";
const filter = createFilterOptions();

export default function EditTripMem({
  triggerTrip,
  member,
  secret,
  trip,
  group_id,
}) {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [triggerEditTripMem, ResultEditTripMem] = usePostEditTripMemMutation();
  const [trpNametoEdit, setTrpNametoEdit] = React.useState([]);
  const [trpIDtoEdit, setTrpIDtoEdit] = React.useState([]);
  const [memberName, setMemberName] = React.useState([]);
  const [memberID, setMemberID] = React.useState([]);
  const [isCheckedMember, setisCheckedMember] = React.useState([]);
  const [isDisable, setIsDisable] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);

  const handleChangeExpand = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleFont = () => {
    return rspWidth("1.2rem", "1rem", "1rem");
  };

  const handleChange = (event) => {
    const memName = getMemberName(event.target.value, trip, member);
    const memID = getMemberID(member, memName);
    const isChMm = getMemberCheck(memName, member);
    setTrpNametoEdit(event.target.value);
    setIsDisable(false);
    setMemberName(memName);
    setMemberID(memID);
    setisCheckedMember(isChMm);
    setTrpIDtoEdit(getTripID(event.target.value, trip));
  };

  const handleEdit = () => {
    triggerEditTripMem({
      trp_id: trpIDtoEdit,
      group_id,
      trp_name: trpNametoEdit,
      mem_id: JSON.stringify(memberID),
    });
    setisCheckedMember([])
    setIsDisable(true)
    setTrpIDtoEdit([]);
    setTrpNametoEdit([]);
    setMemberID([]);
    setMemberName([]);
  };

  React.useEffect(() => {
    if (ResultEditTripMem.data?.status) {
      triggerTrip({ group_id });
    }
  }, [ResultEditTripMem.data]);

  const handleChangeMemName = (event) => {
    const {
      target: { value },
    } = event;
    const memName = typeof value === "string" ? value.split(",") : value;
    const memID = getMemberID(member, memName);
    const isChMm = getMemberCheck(memName, member);
    setMemberName(memName);
    setMemberID(memID);
    setisCheckedMember(isChMm);
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
        <FormControl>
          <InputLabel variant="standard" color="info">
            Pick Event
          </InputLabel>
          <Select
            value={trpNametoEdit}
            onChange={handleChange}
            label="trpNametoEdit"
            variant="standard"
            color="info"
          >
            {trip?.map((item) => (
              <MenuItem key={item.id} value={item.trp_name}>
                {item.trp_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel variant="standard" color="info">
            Member
          </InputLabel>
          <Select
            multiple
            variant="standard"
            color="info"
            disabled={isDisable}
            value={memberName}
            onChange={handleChangeMemName}
            renderValue={(selected) => {
              selected.map((newSelect) => !!newSelect ?? newSelect);
              console.log("memberName = ", memberName);
              console.log("selected = ", selected);
              return selected.join(",");
            }}
          >
            {member.map((item, index) => (
              <MenuItem key={item.id} value={item.mem_name}>
                <Checkbox checked={isCheckedMember[index]} />
                <ListItemText primary={item.mem_name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          sx={{ gridColumn: "span 4" }}
          onClick={handleEdit}
          type="button"
          color="info"
          variant="contained"
        >
          Edit Event's member&nbsp;
          <SendIcon />
        </Button>
      </Box>
    </React.Fragment>
  );
}

function getMemberID(allMember, selectedMember) {
  let newArrayId = [];
  let newArrayNm = [];
  for (let i in allMember) {
    for (let j in selectedMember) {
      if (allMember[i].mem_name === selectedMember[j]) {
        newArrayId[j] = allMember[i].id;
        newArrayNm[j] = allMember[i].mem_name;
      }
    }
  }
  return newArrayId;
}

function getMemberName(trp_name, trips, member) {
  let newMemId;
  let newMemNM = [];
  for (let index in trips) {
    if (trips[index].trp_name === trp_name) {
      newMemId = JSON.parse(trips[index].mem_id);
    }
  }
  for (let index in member) {
    let memID = member[index].id;
    for (let index2 in newMemId) {
      if (memID == newMemId[index2]) {
        newMemNM[index2] = member[index].mem_name; // add only the ID is the same 
      }
    }
  }
  return newMemNM;
}

function getMemberCheck(memName, member) {
  let newArr = [];
  for (let i in member) {
    newArr[i] = false;
    for (let index in memName) {
      if (member[i].mem_name == memName[index]) {
        newArr[i] = true;
      }
    }
  }
  return newArr;
}

function getTripID(trp_name, trips) {
  let trp_id;
  for (let index in trips) {
    if (trips[index].trp_name == trp_name) {
      trp_id = trips[index].id;
    }
  }
  return trp_id;
}
