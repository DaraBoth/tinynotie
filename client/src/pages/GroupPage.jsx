import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";  // Import necessary hooks
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import Topbar from "../global/Topbar";
import TableComponent from "../component/TableComponent";
import CustomDialog from "../component/CustomDialog";
import { tokens } from "../theme";
import {
  useGetMemberMutation,
  useGetTripMutation,
  useGetGroupDetailQuery ,  // Add API to get group details by ID
} from "../api/api";
import ToolTip from "../component/EditMember";
import EditTripMem from "../component/EditTripMember";
import DeleteMember from "../component/deleteMember";
import EditTrip from "../component/EditTrip";
import ShareModal from "../component/ShareModal";
import {
  calculateMoney,
  functionRenderColumns,
} from "../help/helper";
import LoadingPage from "./LoadingPage";
import UnauthorizedPage from "./UnauthorizedPage";

export default function Group({ user, secret, setGroupInfo }) {
  const { groupId } = useParams();  // Get the group ID from the URL
  const navigate = useNavigate();  // Navigate hook for redirection
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { data, error, isLoading } = useGetGroupDetailQuery({
    group_id: groupId,
    user_id: user ? user.id : null,
  });
  const [triggerTrip, resultTrip] = useGetTripMutation();
  const [triggerMember, resultMember] = useGetMemberMutation();
  const [member, setMember] = useState([]);
  const [trip, setTrip] = useState([]);
  const [groupInfo, setGroupInfoState] = useState(null);
  const [openToolTipDialog, setOpenToolTipDialog] = useState(false);
  const [openAddTripDialog, setOpenAddTripDialog] = useState(false);
  const [openEditTripDialog, setOpenEditTripDialog] = useState(false);
  const [openDeleteMemberDialog, setOpenDeleteMemberDialog] = useState(false);
  const [openShareModal, setOpenShareModal] = useState(false);

  useEffect(() => {
    if (data && data.status) {
      setGroupInfo(data.data);
    } else if (data && !data.status) {
      if (data.message === "Authentication required to view this group.") {
        navigate(`/login?redirect=/group/${groupId}`); // Redirect to login
      } else {
        // Show an unauthorized message or redirect to another page
        alert(data.message);
        navigate("/");
      }
    }
  }, [data, navigate, groupId, setGroupInfo]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <UnauthorizedPage />;
  }

  useEffect(() => {
    if (resultGroupDetails.data?.status) {
      const groupData = resultGroupDetails.data.data;
      setGroupInfoState(groupData);

      // If the group is public or the user is authorized, fetch members and trips
      if (groupData.visibility === "public" || groupData.isAuthorized) {
        triggerTrip({ group_id: groupId });
        triggerMember({ group_id: groupId });
      } else if (groupData.visibility === "private") {
        // If the group is private and the user is not authorized, redirect to login
        if (!groupData.isAuthorized) {
          navigate("/login");
        }
      }
    }
  }, [resultGroupDetails, groupId, triggerTrip, triggerMember, navigate]);

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
    () => calculateMoney(member, trip, groupInfo?.currency),
    [member, trip, groupInfo?.currency]
  );
  const columns = useMemo(() => functionRenderColumns(newData), [newData]);

  // Conditional Rendering for Unauthorized Users
  if (!groupInfo) {
    return <Typography>Loading...</Typography>;
  }

  if (groupInfo.visibility === "private" && !groupInfo.isAuthorized) {
    return <Typography>You do not have access to this group.</Typography>;
  }

  return (
    <Box
      sx={{
        backgroundColor: colors.primary[900], // Set page background color
        minHeight: "100vh", // Ensure the background covers the full height
        height: "auto", // Allow the height to adjust automatically
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Topbar
        user={user}
        groupInfo={groupInfo}
        setGroupInfo={setGroupInfoState}
        onShareClick={() => setOpenShareModal(true)}
      />
      <Box
        sx={{
          padding: "20px",
          flexGrow: 1, // Allow this box to grow and take up remaining space
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          {/* Members Section */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                height: "100%", // Ensure card takes full height
                backgroundColor: colors.background, // Set Card background color to white/light
                borderRadius: "8px",
                boxShadow: `0px 4px 10px ${
                  theme.palette.mode === "light"
                    ? "rgba(0, 0, 0, 0.1)"
                    : "rgba(0, 0, 0, 0.5)"
                }`,
              }}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: 2,
                  }}
                >
                  <StickyNote2Icon
                    sx={{ marginRight: 1, color: colors.primary[500] }}
                  />
                  <Typography
                    variant="h6"
                    color={colors.primary[600]}
                    gutterBottom
                  >
                    Note Member Contributions
                  </Typography>
                </Box>
                <Divider sx={{ marginBottom: 2 }} />
                <TableComponent
                  rows={newData || []}
                  columns={columns || []}
                  height={{ xs: "650px", md: "100%" }} // 650px height on mobile, full height on desktop
                  isLoading={!resultTrip.isSuccess}
                  sx={{ flexGrow: 1 }} // Allows the table to grow within the available space
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Trip and Summary Section */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "calc(100vh - 150px)", // Full height minus some padding
            }}
          >
            {/* Recent Trips Card */}
            <Card
              sx={{
                flexGrow: 1,
                minHeight: { xs: "50vh", md: "68%" }, // Adjust height for mobile
                backgroundColor: colors.background,
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: 2,
                  }}
                >
                  <StickyNote2Icon
                    sx={{ marginRight: 1, color: colors.primary[500] }}
                  />
                  <Typography
                    variant="h6"
                    color={colors.primary[500]}
                    gutterBottom
                  >
                    Recent Trips
                  </Typography>
                </Box>
                <Divider sx={{ marginBottom: 2 }} />
                {/* Table content */}
                <TableComponent
                  rows={trip || []}
                  columns={tripColumns || []}
                  height="100%"
                  isLoading={!resultMember.isSuccess}
                  sx={{
                    flexGrow: 1,
                  }}
                />
              </CardContent>
            </Card>

            {/* Total Spend Summary Card */}
            <Card
              sx={{
                flexGrow: 1,
                minHeight: "250px", // Set a more appropriate minimum height
                marginTop: "10px",
                backgroundColor: colors.background,
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%", // Ensure content fills the card height
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: 2,
                  }}
                >
                  <StickyNote2Icon
                    sx={{ marginRight: 1, color: colors.primary[500] }}
                  />
                  <Typography
                    variant="h6"
                    color={colors.primary[500]}
                    gutterBottom
                  >
                    Total Spend Summary
                  </Typography>
                </Box>
                <Divider sx={{ marginBottom: 2 }} />
                <TotalSpendTable
                  info={info}
                  isLoading={!resultMember.isSuccess || !resultTrip.isSuccess}
                  sx={{
                    flexGrow: 1,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Dialogs */}
      <CustomDialog
        open={openToolTipDialog}
        onClose={() => setOpenToolTipDialog(false)}
        title="Edit Member"
      >
        <ToolTip
          triggerMember={triggerMember}
          member={member}
          group_id={groupInfo.group_id}
          currencyType={groupInfo.currency}
        />
      </CustomDialog>

      <CustomDialog
        open={openAddTripDialog}
        onClose={() => setOpenAddTripDialog(false)}
        title="Add Trip"
      >
        <EditTrip
          triggerTrip={triggerTrip}
          member={member}
          secret={secret}
          trip={trip}
          group_id={groupInfo.group_id}
          currencyType={groupInfo.currency}
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
        sx={{ position: "fixed", bottom: 16, right: 16 }}
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

      <ShareModal
        open={openShareModal}
        onClose={() => setOpenShareModal(false)}
        selectedTrips={trip}
        currencyType={groupInfo.currency}
        member={member}
      />
    </Box>
  );
}

const TotalSpendTable = ({ info, isLoading }) => {
  const { totalPaid, totalRemain, totalSpend, totalUnPaid } = info;
  const rows = [{ id: 1, totalPaid, totalRemain, totalSpend, totalUnPaid }];
  const columns = [
    {
      field: "totalPaid",
      headerName: "Paid",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "totalRemain",
      headerName: "UnPaid",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "totalSpend",
      headerName: "Spend",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
    {
      field: "totalUnPaid",
      headerName: "Remain",
      width: 100,
      headerAlign: "center",
      align: "center",
    },
  ];

  return (
    <TableComponent
      rows={rows}
      columns={columns}
      height="250px" // Fixed height for better visibility
      hideFooter={true}
      isLoading={isLoading}
      addToolBar={false}
      sx={{
        minHeight: "250px", // Ensures the table is visible and occupies space
        backgroundColor: "rgba(0, 123, 255, 0.1)", // Light background for visibility during debugging
      }}
    />
  );
};
