import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme";
import { useTranslateMessageMutation } from "../api/api"; // Correctly use translate mutation
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const TranslatePage = () => {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [translate] = useTranslateMessageMutation();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleTranslate = async () => {
    if (!inputText) return;
    setLoading(true);

    try {
      const response = await translate({ message: inputText }).unwrap(); // Properly use mutation with parameters
      const translated = response.isTranslatedTo || "Translation Error";
      setTranslatedText((translated+"").replace("[","").replace("]",""));
      if (!editing) addToHistory(inputText, translated);
      else updateHistory(editId, inputText, translated);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedText("Translation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (original, translated) => {
    setHistory((prevHistory) => [
      ...prevHistory,
      { id: Date.now(), original, translated },
    ]);
  };

  const updateHistory = (id, original, translated) => {
    setHistory((prevHistory) =>
      prevHistory.map((item) =>
        item.id === id ? { ...item, original, translated } : item
      )
    );
    setEditing(false);
    setEditId(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
  };

  const handleDeleteHistory = (id) => {
    setHistory(history.filter((item) => item.id !== id));
  };

  const handleEditHistory = (id) => {
    const item = history.find((item) => item.id === id);
    if (item) {
      setInputText(item.original);
      setTranslatedText(item.translated);
      setEditing(true);
      setEditId(id);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        padding: 4,
        gap: 4,
        backgroundColor:
          theme.palette.mode === "dark" ? colors.grey[800] : colors.grey[100],
        color:
          theme.palette.mode === "dark" ? colors.grey[100] : colors.grey[900],
        minHeight: "100vh",
      }}
    >
      {/* History Section */}
      <Box
        sx={{
          width: { xs: "100%", sm: "30%" },
          padding: 2,
          backgroundColor:
            theme.palette.mode === "dark" ? colors.grey[900] : colors.grey[200],
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Translation History
        </Typography>
        <List>
          {history.map((item) => (
            <ListItem key={item.id} component={Paper} sx={{ mb: 1, p: 1 }}>
              <ListItemText
                primary={item.original}
                secondary={item.translated}
                sx={{ wordBreak: "break-word" }}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleEditHistory(item.id)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteHistory(item.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Translation Section */}
      <Box sx={{ flex: 1, padding: 2 }}>
        <Typography variant="h6">Translate English to Korean</Typography>
        <TextField
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to translate"
          sx={{
            mt: 2,
            backgroundColor:
              theme.palette.mode === "dark"
                ? colors.grey[900]
                : colors.grey[100],
            color:
              theme.palette.mode === "dark"
                ? colors.grey[100]
                : colors.grey[900],
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: colors.grey[700],
              },
              "&:hover fieldset": {
                borderColor: colors.primary[500],
              },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleTranslate}
          sx={{
            mt: 2,
            backgroundColor: colors.primary[500],
            "&:hover": {
              backgroundColor: colors.primary[700],
            },
          }}
          disabled={loading}
        >
          {editing ? "Update" : "Translate"}
          {/* {loading && <CircularProgress size={"small"} sx={{ mt: 2 }} />} */}
        </Button>

        {translatedText && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? colors.grey[900]
                  : colors.grey[200],
              borderRadius: 2,
              position: "relative",
              color:
                theme.palette.mode === "dark"
                  ? colors.grey[100]
                  : colors.grey[900],
            }}
          >
            <Typography variant="body1">{translatedText}</Typography>
            <IconButton
              sx={{ position: "absolute", top: 0, right: 0 }}
              onClick={handleCopy}
            >
              <ContentCopyIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TranslatePage;
