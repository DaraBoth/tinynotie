import { auth } from "@/lib/helper";
import API_ROUTES, { apiRequest } from "@/lib/config/apiRoutes";
import HomePage from "@/components/pages/HomePage";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    return <p>You must be logged in to view this page.</p>;
  }

  const groups = await apiRequest({
    url: API_ROUTES.getGroupByUserId(session.user.id),
    method: "GET",
    fetchType: "server",
  });

  return <HomePage initialGroups={groups} />;
}
