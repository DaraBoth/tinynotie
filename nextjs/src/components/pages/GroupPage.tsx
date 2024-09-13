"use client";

import { useEffect } from "react";
import { useGroupData } from "@/hooks/useGroupData";
// import { calculateMoney, functionRenderColumns } from "@/lib/helper/calculateFunc";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ApiResponse, Member, Trip } from "@/types/api";

interface GroupPageProps {
  groupId: number;
  initialMembers: ApiResponse<Member[]>;
  initialTrips: ApiResponse<Trip[]>;
}

const GroupPage = ({ groupId, initialMembers, initialTrips }: GroupPageProps) => {
  const router = useRouter();

  // Use the custom hook to fetch members and trips data with initial data
  const { members, trips, isLoading, error } = useGroupData({
    groupId,
    initialMembers,
    initialTrips,
  });

  useEffect(() => {
    console.log("Members Data:", members);
    console.log("Trips Data:", trips);
  }, [members, trips]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error fetching data: {error?.toString()}</p>;
  }

  // Calculate financial data for members
  // const { info, newData } = calculateMoney(
  //   members?.data || [],
  //   trips?.data || [],
  //   "$"
  // );

  // const memberColumns = functionRenderColumns(newData);
  // const tripColumns = functionRenderColumns(trips?.data || []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Group Details</h1>
      {/* <div className="mb-6">
        <h2 className="text-xl font-semibold">Group Summary</h2>
        <p>Total Members: {info.totalMember}</p>
        <p>Total Paid: {info.totalPaid}</p>
        <p>Total Remain: {info.totalRemain}</p>
        <p>Total Unpaid: {info.totalUnPaid}</p>
        <p>Total Spend: {info.totalSpend}</p>
      </div> */}

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Members</h2>
        {/* <Table columns={memberColumns} data={newData} /> */}
      </div>

      <div>
        <h2 className="text-xl font-semibold">Trips</h2>
        {/* <Table columns={tripColumns} data={trips?.data || []} /> */}
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default GroupPage;
