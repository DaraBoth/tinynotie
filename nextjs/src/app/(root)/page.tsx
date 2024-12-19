import { auth } from "@/lib/helper";
import HomePage from "@/components/pages/HomePage";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    return <p>You must be logged in to view this page.</p>;
  }

  return <HomePage />;
  
}
