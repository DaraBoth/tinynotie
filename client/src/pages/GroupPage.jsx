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
  Tooltip,
  IconButton,
  alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import TableViewIcon from "@mui/icons-material/TableView";
import ListViewIcon from "@mui/icons-material/ViewList";
import Topbar from "../global/Topbar";
import TableComponent from "../component/TableComponent";
import CustomDialog from "../component/CustomDialog";
import LoadingPage from "../component/Loading";
import UnauthorizedPage from "../component/Unauthorized";
import SpaceSkyNew from "../component/SpaceSkyNew";
import { tokens } from "../theme";
import {
  useGetGroupDetailsMutation,
  useGetMemberMutation,
  useGetTripMutation,
} from "../api/api";
import ToolTip from "../component/EditMember";
import EditTripMem from "../component/EditTripMember";
import DeleteMember from "../component/deleteMember";
import { formatTimeDifference } from "../help/time";
import currency from "currency.js";
import EditTrip from "../component/EditTrip";
import ShareModal from "../component/ShareModal";
import {
  calculateMoney,
  decodeBase64ToObject,
  functionRenderColumns,
  numberAddition,
} from "../help/helper";
import NotFoundPage from "./NotFoundPage";
import ReceiptScanner from "../component/ReceiptScanner";
import { borderRadius, minHeight, minWidth } from "@mui/system";
import useWindowDimensions from "../hooks/useWindowDimensions";

export default function Group({ user, secret, setGroupInfo }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { width: windowWidth } = useWindowDimensions();
  const { groupParam } = useParams(); // Get the group ID from the URL
  const {
    groupId,
    groupName,
    currency: groupCurrency,
    isError,
  } = decodeBase64ToObject(groupParam);
  if (isError) {
    return <NotFoundPage />;
  }
  const navigate = useNavigate();

  const [triggerGroupDetails, resultGroupDetails] =
    useGetGroupDetailsMutation();
  const [triggerTrip, resultTrip] = useGetTripMutation();
  const [triggerMember, resultMember] = useGetMemberMutation();
  const [member, setMember] = useState([]);
  const [trip, setTrip] = useState([]);
  const [openToolTipDialog, setOpenToolTipDialog] = useState(false);
  const [openAddTripDialog, setOpenAddTripDialog] = useState(false);
  const [openEditTripDialog, setOpenEditTripDialog] = useState(false);
  const [openDeleteMemberDialog, setOpenDeleteMemberDialog] = useState(false);
  const [openRecieptScannarDialog, setOpenRecieptScannarDialog] =
    useState(false);
  const [openShareModal, setOpenShareModal] = useState(false);
  const [groupInfoState, setGroupInfoState] = useState(null);
  const [isLoading, setIsLoading] = useState("loadingPage");
  const [memberViewMode, setMemberViewMode] = useState(isNonMobile ? "table" : "list");
  const [tripViewMode, setTripViewMode] = useState(isNonMobile ? "table" : "list");

  useEffect(() => {
    triggerGroupDetails({ group_id: groupId, user_id: secret });
  }, [groupId, secret, triggerGroupDetails]);

  useEffect(() => {
    if (resultGroupDetails.data?.status) {
      const groupData = resultGroupDetails.data.data;
      setGroupInfoState(groupData);

      // If the group is public or the user is authorized, fetch members and trips
      if (groupData.visibility === "public" || groupData.isAuthorized) {
        triggerTrip({ group_id: groupId });
        triggerMember({ group_id: groupId });
        setIsLoading("");
      } else if (groupData.visibility === "private") {
        // If the group is private and the user is not authorized, redirect to login
        if (!groupData.isAuthorized) {
          navigate("/login");
          setIsLoading("unauthorizedPageWithUser");
        }
      }
    }
  }, [resultGroupDetails, groupId, triggerTrip, triggerMember, navigate]);

  // Update trip state when data is fetched
  useEffect(() => {
    if (resultTrip?.data?.status) {
      setTrip(resultTrip.data.data);
    }
  }, [resultTrip]);

  // Update member state when data is fetched
  useEffect(() => {
    if (resultMember?.data?.status) {
      setMember(resultMember.data.data);
    }
  }, [resultMember]);

  // Automatically switch view mode based on screen size
  useEffect(() => {
    setMemberViewMode(isNonMobile ? "table" : "list");
    setTripViewMode(isNonMobile ? "table" : "list");
  }, [isNonMobile]);

  const { info, newData } = useMemo(
    () => calculateMoney(member, trip, groupInfoState?.currency),
    [member, trip, groupInfoState?.currency]
  );

  const columns = useMemo(() => functionRenderColumns(newData), [newData]);

  const tripColumns = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 50,
        headerAlign: "center",
        align: "center",
      },
      {
        field: "trp_name",
        headerName: "Trip Name",
        width: 100,
        headerAlign: "center",
        align: "center",
      },
      {
        field: "spend",
        headerName: "Total Spend",
        headerAlign: "center",
        align: "center",
        width: 100,
        valueGetter: ({ value }) => {
          return currency(value, { symbol: groupInfoState?.currency }).format();
        },
      },
      {
        field: "payer_id",
        headerName: "Paid By",
        headerAlign: "center",
        align: "center",
        width: 100,
        renderCell: (params) => {
          const payerId = params.value;
          if (!payerId) {
            return <span>-</span>;
          }

          const payer = member.find(m => m.id === Number(payerId));
          return (
            <Tooltip title={payer ? `Paid by ${payer.mem_name}` : "Unknown payer"}>
              <span>{payer ? payer.mem_name : "Unknown"}</span>
            </Tooltip>
          );
        },
      },
      {
        field: "mem_id",
        headerName: "Members",
        headerAlign: "center",
        align: "center",
        width: 120,
        renderCell: (params) => {
          const joinedMemId = JSON.parse(params.value);
          const memberNames = member
            .filter((m) => joinedMemId.includes(m.id))
            .map((m) => m.mem_name)
            .join(", ");
          return (
            <Tooltip title={memberNames || "No members"}>
              <span>
                {joinedMemId.length} Member{joinedMemId.length !== 1 ? "s" : ""}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "update_dttm",
        headerName: "Last Updated",
        width: 100,
        valueGetter: ({ value }) => {
          return formatTimeDifference(value);
        },
      },
      { field: "create_date", headerName: "Creation Date", width: 100 },
    ],
    [member, groupInfoState?.currency]
  );

  const actions = [
    {
      icon: <AddIcon />,
      name: "Add Trip",
      onClick: () => setOpenAddTripDialog(true),
    },
    {
      icon: <EditIcon />,
      name: "Edit Trip's Member",
      onClick: () => setOpenEditTripDialog(true),
    },
    {
      icon: <PeopleIcon />,
      name: "Edit Member",
      onClick: () => setOpenToolTipDialog(true),
    },
    {
      icon: <DeleteIcon />,
      name: "Delete Member",
      onClick: () => setOpenDeleteMemberDialog(true),
    },
  ];

  if (isLoading.includes("loadingPage")) {
    return <LoadingPage />;
  }
  if (isLoading.includes("unauthorizedPageWithUser")) {
    return <UnauthorizedPage user={user} />;
  }
  if (isLoading.includes("unauthorizedPage")) {
    return <UnauthorizedPage />;
  }

  return (
    <Box
      sx={{
        backgroundColor: "transparent",
        minHeight: "100vh",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Add the 3D Space Sky background */}
      <SpaceSkyNew />
      <Topbar
        user={user}
        groupInfo={groupInfoState}
        setGroupInfo={setGroupInfo}
        onShareClick={() => setOpenShareModal(true)}
        onScannerClick={() => setOpenRecieptScannarDialog(true)}
      />
      <Box
        sx={{
          padding: { xs: "8px", md: "10px" },
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Grid container spacing={1} sx={{ flexGrow: 1 }}>
          {/* Members Section */}
          <Grid item xs={12} md={8}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              sx={{
                height: "100%",
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(20, 23, 39, 0.6)'
                  : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: "blur(8px)",
                borderRadius: "16px",
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)'}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 20px rgba(0, 0, 0, 0.4)'
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle gradient overlay for depth */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "60px",
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                  zIndex: 0,
                }}
              />

              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  padding: { xs: "16px", md: "20px" },
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                    <Box
                      sx={{
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(0, 123, 255, 0.15)'
                          : 'rgba(0, 123, 255, 0.1)',
                        borderRadius: "12px",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 1.5
                      }}
                    >
                      <StickyNote2Icon
                        sx={{
                          color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                          fontSize: { xs: "1.2rem", md: "1.3rem" }
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                        fontSize: { xs: "1rem", md: "1.1rem" },
                        fontWeight: "600",
                        letterSpacing: "-0.01em"
                      }}
                    >
                      Member Contributions
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() =>
                      setMemberViewMode((prevMode) =>
                        prevMode === "table" ? "list" : "table"
                      )
                    }
                    size="small"
                    sx={{
                      padding: "8px",
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: "10px",
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.1)',
                      }
                    }}
                  >
                    {memberViewMode === "table" ? (
                      <ListViewIcon fontSize="small" />
                    ) : (
                      <TableViewIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
                <Divider
                  sx={{
                    marginBottom: 2,
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)',
                  }}
                />
                <TableComponent
                  rows={newData || []}
                  columns={columns || []}
                  height={{ xs: "auto", md: "100%" }}
                  isLoading={!resultTrip.isSuccess || !resultMember.isSuccess}
                  sx={{ flexGrow: 1 }}
                  rowsPerPage={5}
                  viewMode={memberViewMode}
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
              minHeight: { xs: "auto", md: "calc(100vh - 150px)" },
              marginTop: { xs: 1, md: 0 },
            }}
          >
            {/* Recent Trips Card */}
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              sx={{
                flexGrow: 1,
                minHeight: { xs: "auto", md: "68%" },
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(20, 23, 39, 0.6)'
                  : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: "blur(8px)",
                borderRadius: "16px",
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)'}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 20px rgba(0, 0, 0, 0.4)'
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle gradient overlay for depth */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "60px",
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                  zIndex: 0,
                }}
              />

              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  padding: { xs: "16px", md: "20px" },
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                    <Box
                      sx={{
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(0, 123, 255, 0.15)'
                          : 'rgba(0, 123, 255, 0.1)',
                        borderRadius: "12px",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 1.5
                      }}
                    >
                      <StickyNote2Icon
                        sx={{
                          color: colors.primary[theme.palette.mode === 'dark' ? 400 : 600],
                          fontSize: { xs: "1.2rem", md: "1.3rem" }
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[800],
                        fontSize: { xs: "1rem", md: "1.1rem" },
                        fontWeight: "600",
                        letterSpacing: "-0.01em"
                      }}
                    >
                      Recent Trips
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() =>
                      setTripViewMode((prevMode) =>
                        prevMode === "table" ? "list" : "table"
                      )
                    }
                    size="small"
                    sx={{
                      padding: "8px",
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: "10px",
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.1)',
                      }
                    }}
                  >
                    {tripViewMode === "table" ? (
                      <ListViewIcon fontSize="small" />
                    ) : (
                      <TableViewIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
                <Divider
                  sx={{
                    marginBottom: 2,
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)',
                  }}
                />
                <TableComponent
                  rows={trip || []}
                  columns={tripColumns || []}
                  height={{ xs: "auto", md: "100%" }}
                  isLoading={!resultTrip.isSuccess || !resultMember.isSuccess}
                  sx={{
                    flexGrow: 1,
                  }}
                  rowsPerPage={3}
                  viewMode={tripViewMode}
                />
              </CardContent>
            </Card>

            {/* Total Spend Summary Card */}
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              sx={{
                flexGrow: 1,
                minHeight: { xs: "auto", md: "25%" },
                marginTop: "16px",
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(20, 23, 39, 0.6)'
                  : 'rgba(255, 255, 255, 0.6)',
                backdropFilter: "blur(8px)",
                borderRadius: "16px",
                border: `1px solid ${theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.08)'}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 20px rgba(0, 0, 0, 0.4)'
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Subtle gradient overlay for depth */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "60px",
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                  zIndex: 0,
                }}
              />

              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  padding: { xs: "16px", md: "20px" },
                  position: "relative",
                  zIndex: 1,
                }}
              >
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
          member={member.map((mem, index) => {
            return {
              ...mem,
              unpaid: numberAddition(newData[index].unpaid) - 0,
            };
          })}
          group_id={groupId}
          currencyType={groupInfoState?.currency}
        />
      </CustomDialog>

      <CustomDialog
        open={openAddTripDialog}
        onClose={() => setOpenAddTripDialog(false)}
        title="Edit or Add Trip"
      >
        <EditTrip
          triggerTrip={triggerTrip}
          member={member}
          secret={secret}
          trip={trip}
          group_id={groupId}
          currencyType={groupInfoState?.currency}
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
          group_id={groupId}
        />
      </CustomDialog>

      <CustomDialog
        open={openDeleteMemberDialog}
        onClose={() => setOpenDeleteMemberDialog(false)}
        title="Delete Member"
      >
        <DeleteMember
          triggerMember={triggerMember}
          triggerTrips={triggerTrip} // New prop for triggering trip refresh
          member={member}
          trips={trip} // New prop for trip data
          group_id={groupId}
        />
      </CustomDialog>

      {groupInfoState?.isAdmin && <CustomDialog
        open={openRecieptScannarDialog}
        onClose={() => setOpenRecieptScannarDialog(false)}
        title="Receipt Scanner"
        sx={{
          maxWidth: { xs: "calc(100% - 64px)", sm: "90%", md: "800px" },
          width: { xs: "calc(100% - 64px)", sm: "90%", md: "800px" },
          maxHeight: { xs: "100vh", md: "80vh" },
          '& .MuiDialog-paper': {
            margin: '32px auto',
            minWidth: isMobile ? "auto" : "450px", // Override default minWidth for mobile
          },
          '& .MuiDialogContent-root': {
            padding: { xs: "16px 0", md: "20px 0" },
            overflowY: "auto",
          }
        }}
      >
        <ReceiptScanner
          triggerMember={triggerMember}
          triggerTrips={triggerTrip}
          member={member}
          trips={trip}
          group_id={groupId}
        />
      </CustomDialog>}

      {groupInfoState?.isAdmin && (
        <SpeedDial
          ariaLabel="Group Actions"
          component={motion.div}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          sx={{
            position: "fixed",
            bottom: isNonMobile ? "24px" : "32px", // Increased bottom margin on mobile
            right: isNonMobile ? "24px" : "24px",
            '& .MuiFab-primary': {
              backgroundColor: theme.palette.mode === 'dark'
                ? colors.primary[600]
                : colors.primary[500],
              color: '#fff',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 16px rgba(0, 0, 0, 0.5)'
                : '0 8px 16px rgba(0, 123, 255, 0.3)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? colors.primary[500]
                  : colors.primary[400],
              }
            }
          }}
          icon={<SpeedDialIcon />}
          FabProps={{
            sx: {
              width: isNonMobile ? 56 : 60, // Larger on mobile
              height: isNonMobile ? 56 : 60, // Larger on mobile
            }
          }}
        >
          {actions.map((action, index) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              FabProps={{
                component: motion.button,
                whileHover: { scale: 1.05 },
                whileTap: { scale: 0.95 },
                sx: {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(20, 23, 39, 0.8)'
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: "blur(8px)",
                  border: `1px solid ${theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.08)'}`,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  color: theme.palette.mode === 'dark'
                    ? colors.grey[100]
                    : colors.grey[800],
                  width: isNonMobile ? 'auto' : '44px', // Larger on mobile
                  height: isNonMobile ? 'auto' : '44px', // Larger on mobile
                }
              }}
              TooltipProps={{
                sx: {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(20, 23, 39, 0.9)'
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: "blur(8px)",
                  border: `1px solid ${theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.08)'}`,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  color: theme.palette.mode === 'dark'
                    ? colors.grey[100]
                    : colors.grey[800],
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  padding: '6px 12px',
                  borderRadius: '8px',
                }
              }}
            />
          ))}
        </SpeedDial>
      )}

      <ShareModal
        open={openShareModal}
        onClose={() => setOpenShareModal(false)}
        selectedTrips={trip}
        currencyType={groupInfoState?.currency}
        member={member}
      />
    </Box>
  );
}

const TotalSpendTable = ({ info, isLoading }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { totalPaid, totalRemain, totalSpend, totalUnPaid } = info;
  const rows = [{ id: 1, totalPaid, totalRemain, totalSpend, totalUnPaid }];
  const columns = [
    {
      field: "totalPaid",
      headerName: "Paid",
      width: 100,
      headerAlign: "center",
      align: "center",
      renderCell: ({ value }) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: colors.greenAccent[theme.palette.mode === 'dark' ? 400 : 600],
            fontSize: '0.9rem',
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      field: "totalRemain",
      headerName: "UnPaid",
      width: 100,
      headerAlign: "center",
      align: "center",
      renderCell: ({ value }) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: colors.redAccent[theme.palette.mode === 'dark' ? 400 : 600],
            fontSize: '0.9rem',
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      field: "totalSpend",
      headerName: "Spend",
      width: 100,
      headerAlign: "center",
      align: "center",
      renderCell: ({ value }) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: colors.blueAccent[theme.palette.mode === 'dark' ? 400 : 600],
            fontSize: '0.9rem',
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      field: "totalUnPaid",
      headerName: "Remain",
      width: 100,
      headerAlign: "center",
      align: "center",
      renderCell: ({ value }) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: colors.redAccent[theme.palette.mode === 'dark' ? 400 : 600],
            fontSize: '0.9rem',
          }}
        >
          {value}
        </Typography>
      ),
    },
  ];

  return (
    <TableComponent
      rows={rows}
      columns={columns}
      height="180px"
      hideFooter={true}
      isLoading={isLoading}
      addToolBar={false}
      sx={{
        minHeight: "180px",
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(0, 123, 255, 0.05)'
          : 'rgba(0, 123, 255, 0.03)',
      }}
      viewMode="list"
    />
  );
};
