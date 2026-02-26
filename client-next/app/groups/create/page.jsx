'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Users, FileText, ArrowLeft, Coins, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
import { Badge } from '@/components/ui/badge';
import { SpaceSky } from '@/components/SpaceSky';
import { CURRENCY_OPTIONS } from '@/utils/helpers';

export default function CreateGroupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const memberInputRef = useRef(null);

  const [formData, setFormData] = useState({
    grp_name: '',
    description: '',
    currency: '$',
  });
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState('');

  const createGroupMutation = useMutation({
    mutationFn: (groupData) =>
      api.addGroup({
        user_id: user._id,
        ...groupData,
        status: 1,
        create_date: new Date().toISOString(),
        member: JSON.stringify(members),
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

  const addMember = useCallback(() => {
    const name = memberInput.trim();
    if (!name) return;
    if (members.includes(name)) {
      toast.error(`${name} is already in the list`);
      return;
    }
    setMembers((prev) => [...prev, name]);
    setMemberInput('');
    memberInputRef.current?.focus();
  }, [memberInput, members]);

  const removeMember = (name) => {
    setMembers((prev) => prev.filter((m) => m !== name));
  };

  const handleMemberKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
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

              {/* Members Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Members
                  <span className="text-muted-foreground text-xs">(optional, can add later)</span>
                </Label>

                {/* Member input */}
                <div className="flex gap-2">
                  <Input
                    ref={memberInputRef}
                    placeholder="Type member name and press Enter"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={handleMemberKeyDown}
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addMember}
                    disabled={!memberInput.trim()}
                    title="Add member"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Member chips */}
                <AnimatePresence>
                  {members.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50 border border-input"
                    >
                      {members.map((name) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1.5 pr-1.5 text-sm"
                          >
                            <Users className="h-3 w-3" />
                            {name}
                            <button
                              type="button"
                              onClick={() => removeMember(name)}
                              className="ml-0.5 rounded-full hover:bg-foreground/20 p-0.5 transition-colors"
                              title={`Remove ${name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {members.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {members.length} member{members.length !== 1 ? 's' : ''} added
                  </p>
                )}
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
