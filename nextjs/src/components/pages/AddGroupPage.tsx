"use client";

import { AutocompleteInput } from "@/components/ui/autocompleteInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroups } from "@/hooks/useGroups";
import { MemberResponse } from "@/types/api";
import { useSession } from "next-auth/react";
import { useState } from "react";
import moment from 'moment'

const CreateGroupForm = ({ members: data }: { members: MemberResponse }) => {
  const [redirectToNewGroup, setRedirectToNewGroup] = useState(false);
  const members = data.data.map((m) => m.mem_name); // Array of member names
  const [groupName, setGroupName] = useState("");
  const [currency, setCurrency] = useState("$");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { addGroup } = useGroups();
  const session = useSession();
  console.log(session);
  const handleAddMember = (name: string) => {
    setSelectedMembers((prev) => [...prev, name]);
  };

  const handleRemoveMember = (name: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m !== name));
  };

  const handleSubmit = () => {
    if (!groupName) return alert("Group name is required!");

    addGroup.mutate(
      {
        user_id: session?.data?.user?.id,
        grp_name: groupName,
        currency,
        status: 1,
        create_date: moment().format("YYYY-MM-DD HH:mm:ss"),
        member: JSON.stringify(selectedMembers), // Assuming you send names; adjust if needed
      },
      {
        onSuccess: (data: any) => {
          if (redirectToNewGroup) {
            // Redirect to new group page
            window.location.href = `/group/${data.id}`;
          } else {
            // Redirect to home
            window.location.href = "/";
          }
        },
      }
    );
  };

  return (
    <Card className="max-w-md mx-auto mt-10 p-6">
      <CardHeader>
        <CardTitle className="">Create New Group</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />
        <Select onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue placeholder="Select Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="$">US Dollar</SelectItem>
            <SelectItem value="W">Korean Won</SelectItem>
            <SelectItem value="R">Khmer Riel</SelectItem>
          </SelectContent>
        </Select>

        <AutocompleteInput
          suggestions={members}
          selectedItems={selectedMembers}
          onAddItem={handleAddMember}
          onRemoveItem={handleRemoveMember}
          placeholder="Enter member names"
        />
        <label className="flex items-center mt-4">
          <input
            type="checkbox"
            checked={redirectToNewGroup}
            onChange={() => setRedirectToNewGroup(!redirectToNewGroup)}
            className="mr-2"
          />
          Redirect to the newly created group
        </label>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Create Group</Button>
      </CardFooter>
    </Card>
  );
};

export default CreateGroupForm;
