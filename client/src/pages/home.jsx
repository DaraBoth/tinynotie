import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
  Paper,
} from "@mui/material";
import { useGetGroupMutation } from "../api/api";
import { useNavigate } from "react-router-dom";
import { tokens } from "../theme";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import { rspWidth } from "../responsive";

export default function Home({ user, setUser, secret, setGroupInfo }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [triggerUser, resultUser] = useGetGroupMutation();
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const isNonMobile = useMediaQuery("(min-width:600px)");

  const widthItem = rspWidth("calc(100%/2)", "100%", "260px");
  const gridColItem = rspWidth("repeat(4,1fr)", "repeat(1,1fr)", "auto");
  const fontSize = rspWidth("normal", "18px", "16px");

  useEffect(() => {
    triggerUser({ user, user_id: secret });
  }, [triggerUser, user, secret]);

  useEffect(() => {
    if (resultUser.data?.status) {
      setData(resultUser.data.data);
    }
  }, [resultUser.data]);

  const handleLogout = () => {
    setUser(false);
    navigate("/login");
  };

  const handleCreateGroup = () => {
    navigate("/creategroup");
  };

  const handleGroupClick = (item) => {
    setGroupInfo({
      group_id: item.id,
      grp_name: item.grp_name,
      currency: item.currency,
    });
    navigate("/group");
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        padding: "10px",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          marginBottom: "20px",
          borderRadius: "12px",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom="20px"
        >
          <Typography
            component="span"
            variant="h4"
            color="text.primary"
            fontSize={fontSize}
            fontWeight="bold"
          >
            Welcome to TinyNotie,{" "}
            {user && (
              <>
                Hello{" "}
                <span
                  style={{
                    color: colors.blueAccent[300],
                    fontWeight: "700",
                  }}
                >
                  {user}
                </span>
                !
              </>
            )}
          </Typography>
          <IconButton onClick={handleLogout} aria-label="logout">
            <LogoutIcon sx={{ fill: colors.redAccent[500] }} />
          </IconButton>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: gridColItem,
          gridAutoFlow: "dense",
          gap: "20px",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            cursor: "pointer",
            width: widthItem,
            height: isNonMobile ? "calc(100%/3)" : "auto",
            color: colors.blueAccent[500],
            border: `1px solid ${colors.blueAccent[600]}`,
            borderRadius: "12px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
            },
          }}
          onClick={handleCreateGroup}
        >
          <AddIcon />
          <Typography
            variant="body1"
            display="flex"
            textAlign="center"
            fontWeight={500}
            fontSize={17}
            sx={{ marginLeft: "10px" }}
          >
            New note
          </Typography>
        </Paper>

        {data.length === 0 ? (
          <Typography
            variant="h6"
            width="100%"
            height="50vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
            color="text.secondary"
          >
            No content
          </Typography>
        ) : (
          data
            .slice()
            .reverse()
            .map((item) => (
              <Paper
                key={item.id}
                elevation={3}
                sx={{
                  cursor: "pointer",
                  padding: "15px",
                  borderRadius: "12px",
                  border: `1px solid ${colors.blueAccent[600]}`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
                  },
                }}
                onClick={() => handleGroupClick(item)}
              >
                <ListItemText
                  primary={
                    <Typography variant="h6" fontWeight="bold">
                      Title: {item.grp_name}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        display="block"
                      >
                        Currency:{" "}
                        <span style={{ color: colors.grey[300] }}>
                          {item.currency}
                        </span>
                      </Typography>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        display="block"
                      >
                        Create Date:{" "}
                        <span style={{ color: colors.grey[300] }}>
                          {item.create_date}
                        </span>
                      </Typography>
                    </>
                  }
                />
              </Paper>
            ))
        )}
      </Box>
    </Box>
  );
}
