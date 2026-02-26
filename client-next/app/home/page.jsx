'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/Loading';
import { SpaceSky } from '@/components/SpaceSky';
import { Topbar } from '@/components/global/Topbar';
import { CURRENCY_NAMES, formatTimeDifference } from '@/utils/helpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, grp_name }

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups', user?._id],
    queryFn: async () => {
      const response = await api.getGroupsByUserId(user._id);
      const data = response.data.data || [];
      // Sort by create_date descending (latest first)
      return [...data].sort(
        (a, b) => new Date(b.create_date) - new Date(a.create_date)
      );
    },
    enabled: !!user?._id,
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId) => api.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', user?._id] });
      toast.success('Group deleted successfully');
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete group');
      setDeleteTarget(null);
    },
  });

  if (!isAuthenticated) return <Loading text="Checking authentication..." />;
  if (isLoading) return <Loading text="Loading your groups..." />;

  const getCurrencyLabel = (symbol) =>
    CURRENCY_NAMES[symbol] ? `${symbol} – ${CURRENCY_NAMES[symbol]}` : symbol || '';

  return (
    <div className="min-h-screen relative">
      <SpaceSky />
      <Topbar />

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">
            Welcome, {user?.usernm || 'User'}!
          </h1>
          <p className="text-muted-foreground">Manage your expense groups</p>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Create New Group Card */}
          <Link href="/groups/create">
            <Card className="h-full backdrop-blur-sm bg-card/80 border-dashed border-primary/40 hover:border-primary transition-all cursor-pointer group hover:-translate-y-1 duration-200">
              <CardHeader className="text-center py-10">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-base">Create New Group</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Start tracking expenses with friends
                </p>
              </CardHeader>
            </Card>
          </Link>

          {/* Existing Groups */}
          {groups && groups.map((group) => (
            <div
              key={group.id}
              className="relative group"
            >
              <Link href={`/groups/${group.id}`}>
                <Card className="h-full backdrop-blur-sm bg-card/80 border-primary/20 hover:border-primary/40 transition-all cursor-pointer hover:-translate-y-1 duration-200 overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                  <CardHeader className="pb-2 pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {group.isAdmin && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                        {group.visibility === 'public' && (
                          <Badge variant="outline" className="text-xs">Public</Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base mt-3 truncate">
                      {group.grp_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-4 space-y-1">
                    <p className="text-sm text-primary/80 font-medium">
                      {getCurrencyLabel(group.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatTimeDifference(group.create_date)}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Delete button – admin only, appears on hover */}
              {group.isAdmin && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget({ id: group.id, grp_name: group.grp_name });
                  }}
                  className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                  title="Delete group"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {(!groups || groups.length === 0) && (
          <div className="col-span-full mt-8 text-center">
            <div className="inline-flex flex-col items-center gap-4 p-12 rounded-2xl backdrop-blur-sm bg-card/80 border border-primary/20">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">No Groups Yet</h2>
                <p className="text-muted-foreground">Create your first group to start tracking expenses</p>
              </div>
              <Button asChild size="lg">
                <Link href="/groups/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Group
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Delete Group</DialogTitle>
                <DialogDescription>This action cannot be undone</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <p className="text-sm py-2">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{deleteTarget?.grp_name}</span>?
            All members and trips will be permanently removed.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
