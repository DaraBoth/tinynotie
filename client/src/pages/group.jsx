import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Grid,
  Button,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import Topbar from "../global/Topbar";
import TableComponent from "../component/table";
import CustomDialog from "../component/CustomDialog";
import { tokens } from "../theme";
import {
  useGetMemberMutation,
  useGetTripMutation,
} from "../api/api";
import ToolTip from "../component/EditMember";
import AddTrip from "../component/EditTrip";
import EditTripMem from "../component/editTripMem";
import DeleteMember from "../component/deleteMember";
import currency from "currency.js";

export default function Group({ user, secret, groupInfo, setGroupInfo }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [triggerTrip, resultTrip] = useGetTripMutation();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [triggerMember, resultMember] = useGetMemberMutation();
  const [member, setMember] = useState([]);
  const [trip, setTrip] = useState([]);
  const [openToolTipDialog, setOpenToolTipDialog] = useState(false);
  const [openAddTripDialog, setOpenAddTripDialog] = useState(false);
  const [openEditTripDialog, setOpenEditTripDialog] = useState(false);
  const [openDeleteMemberDialog, setOpenDeleteMemberDialog] = useState(false);
  const currencyType = groupInfo.currency;

  useEffect(() => {
    triggerTrip({ group_id: groupInfo.group_id });
    triggerMember({ group_id: groupInfo.group_id });
  }, [triggerTrip, triggerMember, groupInfo.group_id]);

  useEffect(() => {
    if (resultTrip?.data?.status) {
      setTrip(resultTrip.data.data);
    }
  }, [resultTrip]);

  useEffect(() => {
    if (resultMember?.data?.status) {
      setMember(resultMember.data.data);
    }
  }, [resultMember]);

  const { info, newData } = useMemo(
    () => calculateMoney(member, trip, currencyType),
    [member, trip, currencyType]
  );
  const columns = useMemo(() => functionRenderColumns(newData), [newData]);

  const tripColumns = useMemo(() => [
    { field: "id", headerName: "ID", width: 70, align: 'left', headerAlign: 'left' },
    { field: "trp_name", headerName: "Trip Name", width: 150 },
    {
      field: "spend", headerName: "Spend", width: 100,
      valueGetter: ({ value }) => {
        return formatMoney(value, 2, currencyType);
      },
    },
    {
      field: "mem_id",
      headerName: "Joined",
      width: 150,
      renderCell: (params) => {
        const joinedMemId = JSON.parse(params.value);
        const memberNames = member.filter(m => joinedMemId.includes(m.id)).map(m => m.name).join(", ");
        return (
          <Tooltip title={memberNames || "No members"}>
            <span>{joinedMemId.length} Member{joinedMemId.length !== 1 ? 's' : ''}</span>
          </Tooltip>
        );
      },
    },
    { field: "create_date", headerName: "Created Date", width: 150 },
    { field: "update_dttm", headerName: "Updated Date", width: 150 }
  ], [member, currencyType]);

  const actions = [
    { icon: <AddIcon />, name: 'Add Trip', onClick: () => setOpenAddTripDialog(true) },
    { icon: <EditIcon />, name: 'Edit Trip', onClick: () => setOpenEditTripDialog(true) },
    { icon: <PeopleIcon />, name: 'Edit Member', onClick: () => setOpenToolTipDialog(true) },
    { icon: <DeleteIcon />, name: 'Delete Member', onClick: () => setOpenDeleteMemberDialog(true) },
  ];

  return (
    <main className="content">
      <Topbar user={user} groupInfo={groupInfo} setGroupInfo={setGroupInfo} />
      <Box sx={{ padding: "20px" }}>
        <Grid container spacing={2} sx={{ height: "100%" }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: "100%" }}>
              <TableComponent rows={newData || []} columns={columns || []} height={isNonMobile ? "80vh" : "calc(10 * 50px)"} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Grid container direction="column" spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ height: "100%" }}>
                  <TableComponent rows={Array.isArray(trip) ? trip : []} columns={tripColumns || []} height="calc(85vh / 2)" />
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ height: "100%" }}>
                  <TotalSpendTable info={info} />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <CustomDialog
          open={openToolTipDialog}
          onClose={() => setOpenToolTipDialog(false)}
          title="Edit Member"
        >
          <ToolTip
            triggerMember={triggerMember}
            member={member}
            group_id={groupInfo.group_id}
          />
        </CustomDialog>

        <CustomDialog
          open={openAddTripDialog}
          onClose={() => setOpenAddTripDialog(false)}
          title="Add Trip"
        >
          <AddTrip
            triggerTrip={triggerTrip}
            member={member}
            secret={secret}
            trip={trip}
            group_id={groupInfo.group_id}
          />
        </CustomDialog>

        <CustomDialog
          open={openEditTripDialog}
          onClose={() => setOpenEditTripDialog(false)}
          title="Edit Trip Member"
        >
          <EditTripMem
            triggerTrip={triggerTrip}
            member={member}
            secret={secret}
            trip={trip}
            group_id={groupInfo.group_id}
          />
        </CustomDialog>

        <CustomDialog
          open={openDeleteMemberDialog}
          onClose={() => setOpenDeleteMemberDialog(false)}
          title="Delete Member"
        >
          <DeleteMember
            triggerMember={triggerMember}
            member={member}
            group_id={groupInfo.group_id}
          />
        </CustomDialog>

        <SpeedDial
          ariaLabel="SpeedDial example"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>

      </Box>
    </main>
  );
}


const TotalSpendTable = ({ info }) => {
  const { totalPaid, totalRemain, totalSpend, totalUnPaid } = info;
  const rows = [
    { id: 1, label: "Total Paid", value: totalPaid },
    { id: 2, label: "Total UnPaid", value: totalUnPaid },
    { id: 3, label: "Total Spend", value: totalSpend },
    { id: 4, label: "Total Remain", value: totalRemain },
  ];
  const columns = [
    { field: "label", headerName: "Description", width: 150 },
    { field: "value", headerName: "Amount", width: 150 },
  ];

  return <TableComponent rows={rows} columns={columns} height="calc(70vh / 2)" hideFooter={true} />;
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
      kitLuy[trip.trp_name] = formatMoney(osMnek, 1, currencyType);
    });
    let unPaid = 0;
    totalPaid += paid;
    totalRemain += luySol > 0 ? luySol : unPaid;
    totalUnPaid += luySol > 0 ? unPaid : luySol;
    return {
      id: id + 1,
      name: member.mem_name,
      paid: currency(paid, { symbol: currencyType }).format(),
      ...kitLuy,
      remain: formatMoney(luySol > 0 ? luySol : unPaid, 2, currencyType),
      unpaid: formatMoney(luySol > 0 ? unPaid : luySol, 2, currencyType),
    };
  });
  totalMember = newData.length;
  totalSpend =
    "-" +
    currency(totalPaid, { symbol: currencyType })
      .subtract(totalRemain)
      .format();
  totalPaid = formatMoney(totalPaid, 2, currencyType);
  totalRemain = formatMoney(totalRemain, 2, currencyType);
  totalUnPaid = formatMoney(totalUnPaid, 2, currencyType);

  return {
    info: { totalMember, totalPaid, totalRemain, totalSpend, totalUnPaid },
    newData,
  };
}

function formatMoney(money, option = 2, currencyType) {
  const USD = (value) => currency(value, { symbol: currencyType }).format();
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
    newColumns[i] = {
      field: key[i],
      headerName: title,
      headerAlign: "center",
      align: "center",
    };
    if (title === "Name") {
      newColumns[i] = {
        ...newColumns[i],
        minWidth: 110,
        headerAlign: "left",
        align: "left",
        hideable: false,
      };
    }
    if (title === "Remain" || title === "Unpaid") {
      newColumns[i] = {
        ...newColumns[i],
        minWidth: 110,
        headerAlign: "right",
        align: "right",
      };
    }
    if (title === "ID") {
      newColumns[i] = {
        ...newColumns[i],
        hidden: false,
        minWidth: 60,
        width: 60,
      };
    }
  }
  return newColumns;
}
