'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Trash2, AlertTriangle, Search, SlidersHorizontal, Users2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Magic-UI inspired card with animated gradient glow border + shimmer sweep on hover
function GroupCard({ group, onDelete }) {
  const getCurrencyLabel = (symbol) =>
    CURRENCY_NAMES[symbol] ? `${symbol} – ${CURRENCY_NAMES[symbol]}` : symbol || '';

  const memberCount = Number(group.member_count ?? 0);
  const tripCount = Number(group.trip_count ?? 0);

  return (
    <div className="relative group/card h-full">
      {/* Animated glow border on hover */}
      <div className="absolute -inset-[1px] rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/60 via-purple-500/40 to-blue-500/40 blur-sm" />

      <Link href={`/groups/${group.id}`} className="block relative h-full">
        <div className="relative h-full rounded-xl overflow-hidden backdrop-blur-sm bg-card/80 border border-white/10 group-hover/card:border-primary/30 transition-all duration-300 group-hover/card:-translate-y-1 group-hover/card:shadow-lg group-hover/card:shadow-primary/20">
          {/* Shimmer sweep on hover */}
          <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/5 via-transparent to-transparent" />

          {/* Top color accent */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/80 via-purple-500/60 to-blue-500/60 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

          <div className="p-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0 border border-primary/20 group-hover/card:from-primary/30 group-hover/card:to-purple-500/30 transition-all duration-300">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {group.isAdmin && (
                  <Badge className="text-xs bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Admin</Badge>
                )}
                {!group.isAdmin && group.isMember && (
                  <Badge variant="secondary" className="text-xs">Member</Badge>
                )}
                {group.visibility === 'public' && (
                  <Badge variant="outline" className="text-xs border-blue-400/40 text-blue-400">Public</Badge>
                )}
              </div>
            </div>

            {/* Group name */}
            <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-3 min-h-[2.75rem]">
              {group.grp_name}
            </h3>

            {/* Currency */}
            <p className="text-sm font-medium text-primary/80 mb-4">
              {getCurrencyLabel(group.currency)}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 py-3 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users2 className="h-3.5 w-3.5 text-primary/60" />
                <span className="font-medium text-foreground">{memberCount}</span>
                <span>member{memberCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-purple-400/80" />
                <span className="font-medium text-foreground">{tripCount}</span>
                <span>trip{tripCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Time */}
            <p className="text-xs text-muted-foreground mt-2">
              Created {formatTimeDifference(group.create_date)}
            </p>
          </div>
        </div>
      </Link>

      {/* Delete button – admin only, appears on hover */}
      {group.isAdmin && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete({ id: group.id, grp_name: group.grp_name });
          }}
          className="absolute top-3 right-3 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity p-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-white duration-200"
          title="Delete group"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'members-desc', label: 'Most members' },
  { value: 'trips-desc', label: 'Most trips' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All groups' },
  { value: 'admin', label: 'My groups (Admin)' },
  { value: 'member', label: 'Joined groups' },
  { value: 'public', label: 'Public' },
];

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groupsWithDetails', user?._id],
    queryFn: async () => {
      const response = await api.getGroupsWithDetails(user._id);
      return response.data.data || [];
    },
    enabled: !!user?._id,
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId) => api.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupsWithDetails', user?._id] });
      toast.success('Group deleted successfully');
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete group');
      setDeleteTarget(null);
    },
  });

  const filteredAndSorted = useMemo(() => {
    if (!groups) return [];
    let result = [...groups];

    // Filter
    if (filterBy === 'admin') result = result.filter((g) => g.isAdmin);
    else if (filterBy === 'member') result = result.filter((g) => g.isMember && !g.isAdmin);
    else if (filterBy === 'public') result = result.filter((g) => g.visibility === 'public');

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) => g.grp_name.toLowerCase().includes(q));
    }

    // Sort
    switch (sortBy) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.create_date) - new Date(b.create_date));
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.create_date) - new Date(a.create_date));
        break;
      case 'name-asc':
        result.sort((a, b) => a.grp_name.localeCompare(b.grp_name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.grp_name.localeCompare(a.grp_name));
        break;
      case 'members-desc':
        result.sort((a, b) => Number(b.member_count) - Number(a.member_count));
        break;
      case 'trips-desc':
        result.sort((a, b) => Number(b.trip_count) - Number(a.trip_count));
        break;
      default:
        break;
    }

    return result;
  }, [groups, search, sortBy, filterBy]);

  if (!isAuthenticated) return <Loading text="Checking authentication..." />;
  if (isLoading) return <Loading text="Loading your groups..." />;

  const totalGroups = groups?.length ?? 0;
  const shownCount = filteredAndSorted.length;

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
          <p className="text-muted-foreground">
            {totalGroups === 0
              ? 'Create your first group to start tracking expenses'
              : `You have ${totalGroups} group${totalGroups !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Search + Sort + Filter */}
        {totalGroups > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-card/60 backdrop-blur-sm"
                placeholder="Search groups…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full sm:w-44 bg-card/60 backdrop-blur-sm">
                <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-44 bg-card/60 backdrop-blur-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Create New Group Card */}
          <Link href="/groups/create">
            <div className="h-full min-h-[200px] rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 cursor-pointer group/create backdrop-blur-sm bg-card/40 hover:-translate-y-1 flex flex-col items-center justify-center gap-3 p-8">
              <div className="w-14 h-14 rounded-full bg-primary/10 group-hover/create:bg-primary/20 flex items-center justify-center transition-colors duration-300">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-base">Create New Group</p>
                <p className="text-sm text-muted-foreground mt-1">Start tracking expenses with friends</p>
              </div>
            </div>
          </Link>

          {/* Existing Groups */}
          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((group, i) => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <GroupCard group={group} onDelete={setDeleteTarget} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No results state */}
        {totalGroups > 0 && shownCount === 0 && (
          <div className="mt-8 text-center">
            <div className="inline-flex flex-col items-center gap-3 p-10 rounded-2xl backdrop-blur-sm bg-card/80 border border-primary/20">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No groups match your search</p>
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterBy('all'); }}>
                Clear filters
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalGroups === 0 && (
          <div className="mt-8 text-center">
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
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
