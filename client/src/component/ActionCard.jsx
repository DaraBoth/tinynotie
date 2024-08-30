import { Box, Typography } from "@mui/material";

const ActionCard = ({ title, icon, onClick }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
      borderRadius: 2,
      padding: 2,
      backgroundColor: "background.paper",
      boxShadow: 1,
      transition: "0.3s",
      ":hover": {
        backgroundColor: "primary.light",
        transform: "scale(1.05)",
      },
    }}
    onClick={onClick}
  >
    {icon}
    <Typography variant="subtitle1" sx={{ mt: 1 }}>
      {title}
    </Typography>
  </Box>
);

export default ActionCard;
