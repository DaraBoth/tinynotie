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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Chip from "@/components/ui/chip";
import { useMutation, useQuery } from "@tanstack/react-query";
import API_ROUTES, { apiRequest } from "@/lib/config/apiRoutes";
import { Member, MemberResponse } from "@/types/api";
import { useGroups } from "@/hooks/useGroups";

const CreateGroupForm = () => {
  const [groupName, setGroupName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const { addGroup } = useGroups();

  const { data: membersResponse, isLoading: isMembersLoading } =
    useQuery<MemberResponse>({
      queryKey: ["members"],
      queryFn: async (): Promise<MemberResponse> => {
        return await apiRequest({
          url: API_ROUTES.getAllMembers(),
          method: "GET",
        });
      },
    });

  const members = membersResponse?.data || [];

  const handleAddMember = (name: string) => {
    const member = members.find((m) => m.mem_name === name);
    if (member && !selectedMembers.includes(member)) {
      setSelectedMembers([...selectedMembers, member]);
      setMemberInput("");
    }
  };

  const handleRemoveMember = (name: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.mem_name !== name));
  };

  const handleSubmit = () => {
    if (!groupName) return alert("Group name is required!");

    addGroup.mutate({
      groupName,
      currency,
      members: selectedMembers.map((m) => m.mem_name), // Assuming you send names; adjust if needed
    });
  };

  return (
    <Card className="max-w-md mx-auto mt-10 p-6">
      <CardHeader>
        <CardTitle>Create New Group</CardTitle>
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

        <Input
          placeholder="Enter member names"
          value={memberInput}
          onChange={(e) => setMemberInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddMember(memberInput)}
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedMembers.map((member) => (
            <Chip
              key={member.mem_name}
              onRemove={() => handleRemoveMember(member.mem_name)}
            >
              {member.mem_name}
            </Chip>
          ))}
        </div>
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
