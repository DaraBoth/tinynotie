// src/components/GroupPage.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useGroupData } from "@/hooks/useGroupData";
import { calculateMoney } from "@/lib/helper/calculateFunc";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ApiResponse, Member, Trip } from "@/types/api";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import FapButton from "@/components/ui/fab";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import TanStackTable from "@/components/ui/tanstacktable";
import { SwipeableDrawer } from "@mui/material";
import EditMember from "./UpdateDetail/EditMember";

type GroupObject = {
  groupId: number;
  groupName: string;
  adminId: number;
  currencyType: string;
};

interface GroupPageProps {
  groupObj: GroupObject;
  currencyType: string;
  initialMembers: ApiResponse<Member[]>;
  initialTrips: ApiResponse<Trip[]>;
}

type DrawerType =
  | "editMember"
  | "editTrip"
  | "deleteMember"
  | "deleteTrip"
  | "settings"
  | "";

const GroupPage = ({
  groupObj,
  currencyType,
  initialMembers,
  initialTrips,
}: GroupPageProps) => {
  const router = useRouter();
  const [drawerType, setDrawerType] = useState<DrawerType>("");
  const [openDrawer, setOpenDrawer] = useState(false);

  const { members, trips, isLoading, error } = useGroupData({
    groupId: groupObj.groupId,
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tripsDataWithFakeIds = useMemo(() => {
    return trips && trips.data
      ? trips.data.map((trip, index) => ({
          ...trip,
          id: index + 1,
          real_id: trip.id,
        }))
      : [];
  }, [trips]);

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event &&
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setOpenDrawer(open);
    };

  const handleDrawerState = (type: DrawerType) => {
    setDrawerType(type);
    toggleDrawer(true);
  };

  return (
    <div className="w-fullmx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="link" onClick={() => router.back()} className="p-2">
          <ArrowLeftIcon className="h-6 w-6 text-gray-500 hover:text-gray-700 transition-colors" />
        </Button>
        <h1 className="text-2xl font-bold">{groupObj.groupName}</h1>
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
            id: "ID",
            trp_name: "Name",
            spend: "Spend",
            mem_id: "Member ID",
            group_id: null,
            create_date: "CreatedAt",
            update_dttm: "UpdatedAt",
          }}
        />
      </div>

      <div className="mb-2">
        <SwipeableDrawer
          anchor={"right"}
          open={openDrawer}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
        >
          <div className="flex flex-col items-center justify-center p-4">
            is open
            <EditMember />
            {drawerType === "editMember" && <EditMember />}
            {/* {drawerType === "editTrip" && <EditTrip />}
            {drawerType === "deleteMember" && <DeleteMember />}
            {drawerType === "deleteTrip" && <DeleteTrip />}
            {drawerType === "settings" && <Settings />} */}
          </div>
        </SwipeableDrawer>
        <FapButton
          actions={[
            {
              label: "Edit Member",
              icon: <PersonIcon />,
              onClick: () => handleDrawerState("editMember"),
            },
            {
              label: "Edit Trip",
              icon: <EditIcon />,
              onClick: () => handleDrawerState("editTrip"),
            },
            {
              label: "Delete Member",
              icon: <DeleteIcon />,
              onClick: () => handleDrawerState("deleteMember"),
            },
            {
              label: "Delete Trip",
              icon: <DeleteIcon />,
              onClick: () => handleDrawerState("deleteTrip"),
            },
            {
              label: "Settings",
              icon: <SettingsIcon />,
              onClick: () => handleDrawerState("settings"),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default GroupPage;
