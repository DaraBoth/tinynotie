import { auth } from "@/lib/helper";
import API_ROUTES, { apiRequest } from "@/lib/config/apiRoutes";
import TripsPage from "@/components/pages/Trips/TripsPage";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    return <p>You must be logged in to view this page.</p>;
  }

  const groups = await apiRequest({
    url: API_ROUTES.searchGroups({}),
    method: "GET",
    fetchType: "server",
  });

  console.log(groups);

  return <TripsPage initialGroups={groups} />;
  
}
