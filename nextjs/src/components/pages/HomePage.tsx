"use client";

import { Button } from "@/components/ui/button";
import { useGroups } from "@/hooks/useGroups";
import { Group, GroupRes } from "@/types/api";
import { MagicCard } from "../magicui/magic-card";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { encodeObjectToBase64 } from "@/lib/helper/encode";

export default function HomePage({
  initialGroups,
}: {
  initialGroups: GroupRes;
}) {
  const { res, isLoading, addGroup, error } = useGroups(initialGroups);
  const [groups, setGroups] = useState(res.data);
  const router = useRouter();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error loading groups.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to TinyNotie!</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
              })}`}
            >
              <MagicCard className="relative cursor-pointer flex flex-col items-start justify-center p-4 shadow-2xl bg-pink-700 w-full">
                <Trash2 className="text-red-500 cursor-pointer absolute top-2 right-2" />
                <div className="flex items-start justify-between w-full">
                  <h2 className="text-lg font-bold">Title: {group.grp_name}</h2>
                </div>
                <p className="text-sm text-gray-500">
                  Currency: {group.currency}
                </p>
                <p className="text-xs text-gray-400">
                  {group.create_date} ~{" "}
                  <span className="text-blue-500">{group.create_date}</span>
                </p>
              </MagicCard>
            </Link>
          ))}
      </div>
      <div className="fixed bottom-4 right-4">
        <Button variant="outline">
          <Link href={"/createGroup"}>Add Group</Link>
        </Button>
      </div>
    </div>
  );
}
