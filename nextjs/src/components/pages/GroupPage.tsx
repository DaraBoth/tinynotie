// src/components/GroupPage.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { calculateMoney } from "@/lib/helper/calculateFunc";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ApiResponse, Member, Trip } from "@/types/api";
import TanStackTable from "../ui/tanstacktable";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import FapButton from "@/components/ui/fab";
import ReusablePopup from "@/components/ui/reusablepopup";
import AutocompleteInput from "@/components/ui/autocompleteInput";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

interface GroupPageProps {
  groupId: number;
  currencyType: string;
  initialMembers: ApiResponse<Member[]>;
  initialTrips: ApiResponse<Trip[]>;
}

const GroupPage = ({
  groupId,
  currencyType,
  initialMembers,
  initialTrips,
}: GroupPageProps) => {
  const router = useRouter();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState("");

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

  const { info, newData } = calculateMoney(
    members?.data || [],
    trips?.data || [],
    currencyType
  );

  const tripsDataWithFakeIds = useMemo(() => {
    return trips && trips.data
      ? trips.data.map((trip, index) => ({
          ...trip,
          id: index + 1,
          real_id: trip.id,
        }))
      : [];
  }, [trips?.data]);

  const handlePopupOpen = (type: string) => {
    setPopupType(type);
    setIsPopupOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="p-2"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors" />
        </Button>
        <h1 className="text-2xl font-bold">Group Details</h1>
        <div className="w-6"></div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Members</h2>
        <TanStackTable data={newData} />
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Trips</h2>
        <TanStackTable
          data={tripsDataWithFakeIds}
          columnMapping={{
            status: null,
            description: null,
            group_id: null,
            id: "ID",
            real_id: null,
          }}
        />
      </div>

      <FapButton
        actions={[
          {
            label: "Edit Member",
            icon: <PersonIcon />,
            onClick: () => handlePopupOpen("editMember"),
          },
          {
            label: "Edit Trip",
            icon: <EditIcon />,
            onClick: () => handlePopupOpen("editTrip"),
          },
          {
            label: "Delete Member",
            icon: <DeleteIcon />,
            onClick: () => handlePopupOpen("deleteMember"),
          },
          {
            label: "Delete Trip",
            icon: <DeleteIcon />,
            onClick: () => handlePopupOpen("deleteTrip"),
          },
          {
            label: "Settings",
            icon: <SettingsIcon />,
            onClick: () => handlePopupOpen("settings"),
          },
        ]}
      />

      {isPopupOpen && (
        <ReusablePopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          content={
            <>
              <AutocompleteInput
                suggestions={[]} // Add relevant suggestions here
                selectedItems={[]}
                onAddItem={(item) => console.log("Add:", item)}
                onRemoveItem={(item) => console.log("Remove:", item)}
              />
            </>
          }
        />
      )}
    </div>
  );
};

export default GroupPage;
