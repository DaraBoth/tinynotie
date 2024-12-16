"use client";

import { Button } from "@/components/ui/button";
import { useGroups } from "@/hooks/useGroups";
import { GroupRes } from "@/types/api";
import { MagicCard } from "../magicui/magic-card";
import { Trash2, Moon, Sun } from "lucide-react"; // Import icons for dark/light mode
import { useState } from "react";
import { signOut, useSession } from "next-auth/react"; // Import for authentication
import Link from "next/link";
import { encodeObjectToBase64 } from "@/lib/helper/encode";
import { useTheme } from "next-themes"; // Import the useTheme hook

export default function HomePage({
  initialGroups,
}: {
  initialGroups: GroupRes;
}) {
  const { res, isLoading, error } = useGroups(initialGroups);
  const [groups] = useState(res.data);
  const { data: session } = useSession(); // Get session data (user)
  const { theme, setTheme } = useTheme(); // Using next-themes to toggle themes

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error loading groups.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header with welcome message, dark mode switch, and logout */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Welcome to TinyNotie, {session?.user?.usernm}!
        </h1>
        <div className="flex items-center space-x-4">
          {/* Dark/Light Mode Switch */}
          <Button
            variant="outline"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="text-yellow-500" /> : <Moon />}
          </Button>
          {/* Logout Button */}
          <Button variant="outline" onClick={() => signOut()}>
            Logout
          </Button>
        </div>
      </div>

      {/* Group cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {groups
          .filter((item: any) => item.isAdmin)
          .slice()
          .reverse()
          .map((group) => (
            <Link
              key={group.id}
              href={`/group/${encodeObjectToBase64({
                groupId: group.id,
                groupName: group.grp_name,
                adminId: group.admin_id,
                currencyType: group.currency,
              })}`}
            >
              <MagicCard>
                <div className="flex items-start justify-between w-full">
                  <h2 className="text-lg font-bold">Title: {group.grp_name}</h2>
                </div>
                <p className="text-sm text-gray-500">
                  Currency: {group.currency}
                </p>
                <p className="text-xs flex-1 text-gray-400">
                  {group.create_date} ~{" "}
                  <span className="text-blue-500">{group.create_date}</span>
                </p>

                {/* Buttons placed below create date */}
                <div className="flex absolute top-1 right-3 space-x-4 mt-2 z-20">
                  <Trash2
                    className="text-red-500 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Delete group logic here");
                    }}
                  />
                </div>
              </MagicCard>
            </Link>
          ))}
      </div>

      {/* Add Group Button */}
      <div className="fixed bottom-4 right-4">
        <Button variant="outline">
          <Link href={"/createGroup"}>Add Group</Link>
        </Button>
      </div>
    </div>
  );
}
