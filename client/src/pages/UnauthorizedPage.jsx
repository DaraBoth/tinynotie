import { Box, Button, Typography, Container, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

const UnauthorizedPage = ({user}) => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    const currentPath = window.location.pathname; // Get current URL path
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "background.default",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            textAlign: "center",
            backgroundColor: "background.paper",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {user? `Sorry ${user}! The admin of this group doesn't allow you.` : "This is a private page. You are not authorized to view this page."}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGoToLogin}
            sx={{ mt: 3 }}
          >
            {user? "Go to Home Page" : "Go to Login Page"}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default UnauthorizedPage;
