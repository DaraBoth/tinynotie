import React, { useEffect, useState } from "react";
import Topbar from "../global/Topbar";
import TableComponent from "../component/table";
import {
  Box,
  Icon,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  colors,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { tokens } from "../theme";
import { useGetMemberMutation, useGetTripMutation } from "../api/api";
import ToolTip from "../component/toolTip";
import AddTrip from "../component/addtrip";
import PaidIcon from "@mui/icons-material/Paid";
import EditTripMem from "../component/editTripMem";
import PaymentIcon from "@mui/icons-material/Payment";
import MoneyOffCsredIcon from "@mui/icons-material/MoneyOffCsred";
import DeleteMember from "../component/deleteMember";
import currency from "currency.js";

export default function Group({ user, secret, groupInfo, setGroupInfo }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [triggerTrip, resultTrip] = useGetTripMutation();
  const [triggerMember, resultMember] = useGetMemberMutation();
  const [member, setMember] = useState([]);
  const [trip, setTrip] = useState([]);
  const currencyType = groupInfo.currency;

  useEffect(() => {
    triggerTrip({ group_id: groupInfo.group_id });
    triggerMember({ group_id: groupInfo.group_id });
  }, []);

  useEffect(() => {
    if (resultTrip.data?.status) {
      setTrip(resultTrip.data?.data);
    }
  }, [resultTrip.data]);

  useEffect(() => {
    if (resultMember.data?.status) {
      setMember(resultMember.data?.data);
    }
  }, [resultMember.data]);

  const { info, newData } = calculateMoney(member, trip, currencyType);
  const rows = newData;
  const columns = functionRenderColumns(rows);

  return (
    <main className="content">
      <Topbar user={user} groupInfo={groupInfo} setGroupInfo={setGroupInfo} />
      <div className="body">
        <TitleComponent info={info} />
        <TableComponent rows={rows ?? []} columns={columns ?? []} />
        <ToolTip
          triggerMember={triggerMember}
          member={member}
          group_id={groupInfo.group_id}
        />
        <AddTrip
          triggerTrip={triggerTrip}
          member={member}
          secret={secret}
          trip={trip}
          group_id={groupInfo.group_id}
        />
        <EditTripMem
          triggerTrip={triggerTrip}
          member={member}
          secret={secret}
          trip={trip}
          group_id={groupInfo.group_id}
        />
        <DeleteMember
          triggerMember={triggerMember}
          member={member}
          group_id={groupInfo.group_id}
        />
      </div>
    </main>
  );
}

const TitleComponent = ({ info }) => {
  const { totalPaid, totalRemain, totalSpend, totalUnPaid } = info;
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const isGalaxyFold = useMediaQuery("(max-width:280px)");
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      display="grid"
      gap="10px"
      gridTemplateColumns="repeat(4, 1fr)"
      sx={{
        position: "sticky",
        top: "15px",
        backgroundColor: colors.backrgound,
        borderRadius: "10px",
        zIndex: 1,
        "& > .MuiListItem-root": {
          gridColumn: isNonMobile ? "span 1" : "span 2",
          border: `2px solid ${colors.blueAccent[500]}`,
          borderRadius: "10px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          overflowY: isGalaxyFold ? "scroll" : undefined,
          boxSizing: "border-box",
        },
        "& > .MuiListItem-root::-webkit-scrollbar": {
          display: "none",
        },
        "& > .MuiListItem-root .MuiBox-root": {
          gridColumn: "span 1",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          placeItems: "center",
          gap: "5px",
          position: "relative",
        },
        "& > .MuiListItem-root .MuiBox-root div ": {
          position: "absolute",
          display: isGalaxyFold ? "none" : undefined,
          top: "-110%",
          left: "0%",
          backgroundColor: colors.backrgound,
          padding: "0px 5px",
          paddingTop: "1px",
          borderRadius: "5px",
          zIndex: "5",
        },
        "& > .MuiListItem-root .MuiListItemText-root ": {
          gridColumn: "span 2",
          textAlign: "right",
        },
      }}
    >
      <ListItem>
        <Box>
          <div>Paid</div>
          <PaymentIcon sx={{ fill: colors.blueAccent[500] }} />
        </Box>
        <ListItemText primary={`${totalPaid}`} />
      </ListItem>
      <ListItem color={colors.primary[400]}>
        <Box>
          <div>UnPaid</div>
          <PaidIcon sx={{ fill: "#ffa900" }} />
        </Box>
        <ListItemText primary={`${totalUnPaid} `} />
      </ListItem>
      <ListItem>
        <Box>
          <div>Spend</div>
          <MoneyOffCsredIcon sx={{ fill: colors.redAccent[500] }} />
        </Box>
        <ListItemText primary={`${totalSpend}`} />
      </ListItem>
      <ListItem>
        <Box>
          <div>Remain</div>
          <PaidIcon sx={{ fill: colors.greenAccent[500] }} />
        </Box>
        <ListItemText primary={`${totalRemain}`} />
      </ListItem>
    </Box>
  );
};

function calculateMoney(allMembers, trips, currencyType) {
  let newData = [];
  let kitLuy = {};

  let totalMember = 0,
    totalPaid = 0,
    totalRemain = 0,
    totalUnPaid = 0,
    totalSpend = 0;
  newData = allMembers.map((member, id) => {
    let luyForTrip = 0;
    let paid = member.paid;
    let luySol = paid;
    trips.forEach((trip) => {
      let { mem_id, spend } = trip;
      mem_id = JSON.parse(mem_id);
      let osMnek = 0;
      const joinedMemCount = getMemberID(allMembers, mem_id);
      mem_id.forEach((joined) => {
        if (member.id === Number(joined)) {
          osMnek = currency(spend).divide(joinedMemCount);
          luyForTrip += spend / joinedMemCount;
          luySol = member.paid - luyForTrip;
        }
      });
      kitLuy[trip.trp_name] = formatMoney(osMnek, 1,currencyType);
    });
    let unPaid = 0;
    totalPaid += paid;
    totalRemain += luySol > 0 ? luySol : unPaid;
    totalUnPaid += luySol > 0 ? unPaid : luySol;
    return {
      id: id + 1,
      name: member.mem_name,
      paid: currency(paid,  { symbol: currencyType }).format(),
      ...kitLuy,
      remain: formatMoney(luySol > 0 ? luySol : unPaid,2,currencyType),
      unpaid: formatMoney(luySol > 0 ? unPaid : luySol,2,currencyType),
    };
  });
  totalMember = newData.length;
  totalSpend = "-" + currency(totalPaid, { symbol: currencyType }).subtract(totalRemain).format();
  totalPaid = formatMoney(totalPaid,2,currencyType);
  totalRemain = formatMoney(totalRemain,2,currencyType);
  totalUnPaid = formatMoney(totalUnPaid,2,currencyType);

  return {
    info: { totalMember, totalPaid, totalRemain, totalSpend, totalUnPaid },
    newData,
  };
}

function formatMoney(money, option = 2, currencyType) {
  const USD = (value) => currency(value,  { symbol: currencyType }).format();
  if (!money) return "-/-  ";
  if (option === 1) {
    return "-" + USD(money);
  }
  if (option === 2) {
    return USD(money);
  }
  if (option === 3) {
    return USD(money);
  } else {
    return USD(money);
  }
}

function getMemberID(allMember, selectedMember) {
  let newArrayId = [];
  for (let i in allMember) {
    for (let j in selectedMember) {
      if (allMember[i].id === selectedMember[j]) {
        newArrayId[j] = allMember[i].id;
      }
    }
  }
  return newArrayId.length;
}

function functionRenderColumns(rows) {
  let headerValues = ["ID", "Name", "Paid", "Remain", "Unpaid"];
  let newColumns = [],
    key;
  try {
    key = Object.keys(rows[0]);
  } catch {
    key = headerValues;
  }
  for (let i in key) {
    let title = key[i];
    for (let j in headerValues) {
      if (
        key[i].toLocaleLowerCase().includes(headerValues[j].toLocaleLowerCase())
      ) {
        title = headerValues[j];
      }
    }
    // set column style
    newColumns[i] = {
      field: key[i],
      headerName: title,
      headerAlign: "center",
      align: "center",
    };
    if (title === "Name") {
      newColumns[i] = Object.assign(newColumns[i], {
        minWidth: 110,
        headerAlign: "left",
        align: "left",
        hideable: false,
      });
    }
    if (title === "Remain" || title === "Unpaid") {
      newColumns[i] = Object.assign(newColumns[i], {
        minWidth: 110,
        headerAlign: "right",
        align: "right",
      });
    }
    if (title === "ID") {
      newColumns[i] = Object.assign(newColumns[i], {
        hidden: false,
        minWidth: 60,
        width: 60,
      });
    }
  }
  return newColumns;
}
