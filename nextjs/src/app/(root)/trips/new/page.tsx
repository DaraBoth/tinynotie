import AddGroupPage from "@/components/pages/AddGroupPage";
import API_ROUTES, { apiRequest } from "@/lib/config/apiRoutes";
import React from "react";

const page = async () => {
  const members = await apiRequest({
    url: API_ROUTES.getAllMembers(),
    method: "GET",
    fetchType: "server",
  });
  return <AddGroupPage members={members} />;
};

export default page;
