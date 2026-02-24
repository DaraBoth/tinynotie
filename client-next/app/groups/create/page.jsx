'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Users, FileText } from 'lucide-react';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpaceSky } from '@/components/SpaceSky';
import { Loading } from '@/components/Loading';
import { Topbar } from '@/components/global/Topbar';

export default function CreateGroupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    grp_name: '',
    grp_description: '',
  });

  const createGroupMutation = useMutation({
    mutationFn: (groupData) => api.addGroup({ 
      user_id: user._id, 
      ...groupData,
      member: JSON.stringify([]), // Add empty member array
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

    createGroupMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (createGroupMutation.isPending) {
    return <Loading text="Creating group..." />;
  }

  return (
    <div className="min-h-screen relative">
      <SpaceSky />
      <Topbar />
      
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create New Group</CardTitle>
                <CardDescription>
                  Set up a new expense tracking group
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="grp_name" className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Group Name *
                </label>
                <Input
                  id="grp_name"
                  name="grp_name"
                  type="text"
                  placeholder="Trip to Japan 2026"
                  value={formData.grp_name}
                  onChange={handleChange}
                  required
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="grp_description" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description (Optional)
                </label>
                <textarea
                  id="grp_description"
                  name="grp_description"
                  placeholder="Add details about this group..."
                  value={formData.grp_description}
                  onChange={handleChange}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="text-sm font-medium">Next Steps</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">1.</span>
                    <span>Create your group</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">2.</span>
                    <span>Add members to the group</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">3.</span>
                    <span>Start tracking expenses</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/home')}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  );
}
