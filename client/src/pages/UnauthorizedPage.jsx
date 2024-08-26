import { useNavigate } from "react-router-dom";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    const currentPath = window.location.pathname; // Get current URL path
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  return (
    <Box>
      <Typography>You are not authorized to view this page.</Typography>
      <Button onClick={handleGoToLogin}>Go to Login Page</Button>
    </Box>
  );
};

export default UnauthorizedPage;