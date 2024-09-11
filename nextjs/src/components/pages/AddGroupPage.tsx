"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroups } from "@/hooks/useGroups";
import { Member, MemberResponse } from "@/types/api";
import { AutocompleteInput } from "@/components/ui/autocompleteInput";

const CreateGroupForm = ({ members: data }: { members: MemberResponse }) => {
  const members = data.data.map((m) => m.mem_name); // Array of member names
  const [groupName, setGroupName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const { addGroup } = useGroups();

  const handleAddMember = (name: string) => {
    setSelectedMembers((prev) => [...prev, name]);
  };

  const handleRemoveMember = (name: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m !== name));
  };

  const handleSubmit = () => {
    if (!groupName) return alert("Group name is required!");

    addGroup.mutate({
      groupName,
      currency,
      members: selectedMembers, // Assuming you send names; adjust if needed
    });
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
            <SelectItem value="USD">US Dollar</SelectItem>
            <SelectItem value="KRW">Korean Won</SelectItem>
            <SelectItem value="KHR">Khmer Riel</SelectItem>
          </SelectContent>
        </Select>

        <AutocompleteInput
          suggestions={members}
          selectedItems={selectedMembers}
          onAddItem={handleAddMember}
          onRemoveItem={handleRemoveMember}
          placeholder="Enter member names"
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => console.log("Cancelled")}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Create Group</Button>
      </CardFooter>
    </Card>
  );
};

export default CreateGroupForm;
