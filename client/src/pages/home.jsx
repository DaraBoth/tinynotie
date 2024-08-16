import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useGetGroupMutation } from "../api/api";
import { useNavigate } from "react-router-dom";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { useTheme } from "@mui/material";
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
  const widthItem = rspWidth("calc(100%/5)", "100%", "260px");
  const gridColItem = rspWidth("repeat(4,1fr)", "repeat(1,1fr)", "auto");
  const fontSize = rspWidth("normal", "18px", "16px");

  useEffect(() => {
    triggerUser({ user, user_id: secret });
  }, []);

  useEffect(() => {
    if (resultUser.data?.status) {
      setData(resultUser.data.data);
    }
  }, [resultUser.data]); // eslint-disable-line

  return (
    <List
      sx={{
        width: "100%",
        height: "100%",
        padding: "10px",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <ListItem alignItems="flex-start">
        <ListItemText
          primary={
            <Typography
              sx={{ display: "inline" }}
              component="span"
              variant="h2"
              color="text.primary"
              fontSize={fontSize}
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
          }
        />
        <IconButton
          onClick={() => {
            setUser(false);
            navigate("/login");
          }}
        >
          <LogoutIcon sx={{ fill: colors.redAccent[500] }} />
        </IconButton>
      </ListItem>
      <ListItem
        sx={{
          cursor: "pointer",
          width: widthItem,
          height: "calc(100%/6)",
          color: colors.blueAccent[500],
        }}
      >
        <ListItemText
          onClick={() => {
            navigate("/creategroup");
          }}
          primary={
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AddIcon />
              <Typography
                variant="body1"
                width={"100%"}
                display={"flex"}
                textAlign={"center"}
                fontWeight={500}
                fontSize={17}
              >
                New note
              </Typography>
            </Box>
          }
        />
      </ListItem>
      <Box
        width={"100%"}
        display={"grid"}
        gridTemplateColumns={gridColItem}
        gridAutoFlow={"dense"}
        direction={"ltr"}
        gap={"10px"}
      >
        {data.length === 0 ? (
          <Typography
            variant="h6"
            width={"100%"}
            height={"50vh"}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            no content
          </Typography>
        ) : (
          data
            ?.map((item, index) => {
              return (
                <ListItem
                  key={item.id}
                  sx={{
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                    border: `1px solid ${colors.blueAccent[600]}`,
                  }}
                  alignItems="flex-start"
                  onClick={() => {
                    setGroupInfo({
                      group_id: item.id,
                      grp_name: item.grp_name,
                      currency: item.currency,
                    });
                    navigate("/group");
                  }}
                >
                  <ListItemText
                    primary={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{`Title : ${item.grp_name}`}</span>
                      </div>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          sx={{ display: "block" }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Currency :{" "}
                          <span style={{ color: colors.grey[300] }}>
                            {item.currency}
                          </span>
                        </Typography>
                        <Typography
                          sx={{ display: "block" }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          Create Date :{" "}
                          <span style={{ color: colors.grey[300] }}>
                            {item.create_date}
                          </span>
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              );
            })
            .reverse()
        )}
      </Box>
    </List>
  );
}
