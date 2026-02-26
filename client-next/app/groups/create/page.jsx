'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Users, FileText, ArrowLeft, Coins } from 'lucide-react';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SpaceSky } from '@/components/SpaceSky';
import { CURRENCY_OPTIONS } from '@/utils/helpers';

export default function CreateGroupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    grp_name: '',
    description: '',
    currency: '$',
  });

  const createGroupMutation = useMutation({
    mutationFn: (groupData) =>
      api.addGroup({
        user_id: user._id,
        ...groupData,
        status: 1,
        create_date: new Date().toISOString(),
        member: JSON.stringify([]),
      }),
    onSuccess: (response) => {
      toast.success('Group created successfully!');
      const groupId = response.data.data?.id;
      if (groupId) {
        router.push(`/groups/${groupId}`);
      } else {
        router.push('/home');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create group';
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.grp_name.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (!formData.currency) {
      toast.error('Please select a currency');
      return;
    }
    createGroupMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen relative">
      <SpaceSky />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 p-4 md:p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/home')}
          className="backdrop-blur-sm bg-card/60"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Create New Group</h1>
      </div>

      <main className="relative z-10 container mx-auto px-4 pb-12 max-w-lg">
        <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Group Details</CardTitle>
            <CardDescription>Set up your new expense tracking group</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {/* Group Name */}
              <div className="space-y-2">
                <Label htmlFor="grp_name" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Group Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="grp_name"
                  name="grp_name"
                  placeholder="e.g. Trip to Japan 2026"
                  value={formData.grp_name}
                  onChange={handleChange}
                  required
                  className="text-base"
                  autoFocus
                />
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Currency <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(val) => setFormData((p) => ({ ...p, currency: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Add details about this group..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              {/* Next Steps hint */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-1.5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">After creating:</p>
                <p>① Add members to split expenses with</p>
                <p>② Record trips / expenses</p>
                <p>③ Track who owes what</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/home')}
                  disabled={createGroupMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createGroupMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  );
}
