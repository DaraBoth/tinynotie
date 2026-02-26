'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Users, Trash2, AlertTriangle, Search, SlidersHorizontal,
  Users2, TrendingUp, DollarSign, Calendar, Crown, Globe, Lock, ChevronRight,
} from 'lucide-react';
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
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Colour palette per index for the top accent bar
const ACCENT_GRADIENTS = [
  'from-blue-500 via-indigo-400 to-purple-500',
  'from-emerald-400 via-teal-400 to-cyan-500',
  'from-orange-400 via-amber-400 to-yellow-400',
  'from-pink-500 via-rose-400 to-red-400',
  'from-violet-500 via-purple-400 to-fuchsia-500',
  'from-teal-400 via-cyan-400 to-sky-500',
];

function formatMoney(amount, currency) {
  const num = Number(amount ?? 0);
  const sym = currency || '';
  if (num >= 1_000_000) return `${sym}${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${sym}${(num / 1_000).toFixed(1)}K`;
  return `${sym}${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function GroupCard({ group, index, onDelete }) {
  const currencySymbol = group.currency || '';
  const currencyLabel = CURRENCY_NAMES[currencySymbol]
    ? `${currencySymbol} – ${CURRENCY_NAMES[currencySymbol]}`
    : currencySymbol;
  const memberCount = Number(group.member_count ?? 0);
  const tripCount = Number(group.trip_count ?? 0);
  const totalSpend = Number(group.total_spend ?? 0);
  const totalPaid = Number(group.total_paid ?? 0);
  const balance = totalPaid - totalSpend;
  const accent = ACCENT_GRADIENTS[index % ACCENT_GRADIENTS.length];

  return (
    <div className="relative group/card h-full">
      {/* Hover glow */}
      <div className={`absolute -inset-[1px] rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${accent} blur-md`} />

      <Link href={`/groups/${group.id}`} className="block relative h-full">
        <div className="relative h-full rounded-2xl overflow-hidden bg-card/85 dark:bg-card/70 backdrop-blur-md border border-border/60 group-hover/card:border-primary/40 transition-all duration-300 group-hover/card:-translate-y-1.5 group-hover/card:shadow-2xl group-hover/card:shadow-primary/10">

          {/* Top accent stripe */}
          <div className={`h-1 bg-gradient-to-r ${accent}`} />

          {/* Subtle shimmer on hover */}
          <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-white/4 via-transparent to-transparent" />

          <div className="p-5">
            {/* Row 1: icon + badges + delete */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} opacity-80 flex items-center justify-center shrink-0 shadow-sm`}>
                <Users className="h-5 w-5 text-white drop-shadow" />
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {group.isAdmin && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1">
                    <Crown className="h-2.5 w-2.5" /> Admin
                  </Badge>
                )}
                {!group.isAdmin && group.isMember && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Member</Badge>
                )}
                {group.visibility === 'public'
                  ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-sky-400/40 text-sky-400 gap-1"><Globe className="h-2.5 w-2.5" /> Public</Badge>
                  : <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground gap-1"><Lock className="h-2.5 w-2.5" /> Private</Badge>
                }
              </div>
            </div>

            {/* Group name */}
            <h3 className="font-bold text-base leading-snug line-clamp-2 mb-1 tracking-tight">
              {group.grp_name}
            </h3>
            <p className="text-xs font-medium text-primary/70 mb-4">{currencyLabel}</p>

            {/* Money stats */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              <div className="rounded-lg bg-muted/50 dark:bg-white/5 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center justify-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" /> Spent
                </p>
                <p className="text-xs font-bold tabular-nums truncate">{formatMoney(totalSpend, currencySymbol)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 dark:bg-white/5 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5 flex items-center justify-center gap-0.5">
                  <DollarSign className="h-2.5 w-2.5" /> Paid
                </p>
                <p className="text-xs font-bold tabular-nums truncate">{formatMoney(totalPaid, currencySymbol)}</p>
              </div>
              <div className="rounded-lg p-2.5 text-center" style={{ background: balance >= 0 ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)' }}>
                <p className="text-[10px] text-muted-foreground mb-0.5">Balance</p>
                <p className={`text-xs font-bold tabular-nums truncate ${balance >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                  {balance >= 0 ? '+' : ''}{formatMoney(balance, currencySymbol)}
                </p>
              </div>
            </div>

            {/* Footer: members, trips, date */}
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users2 className="h-3 w-3" />
                  <span className="font-semibold text-foreground">{memberCount}</span>
                  {memberCount === 1 ? 'member' : 'members'}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="font-semibold text-foreground">{tripCount}</span>
                  {tripCount === 1 ? 'trip' : 'trips'}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatTimeDifference(group.create_date)}
              </span>
            </div>
          </div>

          {/* Open hint */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
            <ChevronRight className="h-4 w-4 text-primary" />
          </div>
        </div>
      </Link>

      {/* Delete button */}
      {group.isAdmin && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete({ id: group.id, grp_name: group.grp_name }); }}
          className="absolute top-3 right-3 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity p-1.5 rounded-md bg-background/90 backdrop-blur-sm border border-destructive/30 text-destructive hover:bg-destructive hover:text-white duration-200 shadow-sm"
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
  { value: 'spend-desc', label: 'Most spent' },
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
      toast.success('Group deleted');
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
    if (filterBy === 'admin') result = result.filter((g) => g.isAdmin);
    else if (filterBy === 'member') result = result.filter((g) => g.isMember && !g.isAdmin);
    else if (filterBy === 'public') result = result.filter((g) => g.visibility === 'public');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) => g.grp_name.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'date-asc':  result.sort((a, b) => new Date(a.create_date) - new Date(b.create_date)); break;
      case 'date-desc': result.sort((a, b) => new Date(b.create_date) - new Date(a.create_date)); break;
      case 'name-asc':  result.sort((a, b) => a.grp_name.localeCompare(b.grp_name)); break;
      case 'name-desc': result.sort((a, b) => b.grp_name.localeCompare(a.grp_name)); break;
      case 'members-desc': result.sort((a, b) => Number(b.member_count) - Number(a.member_count)); break;
      case 'spend-desc':   result.sort((a, b) => Number(b.total_spend) - Number(a.total_spend)); break;
    }
    return result;
  }, [groups, search, sortBy, filterBy]);

  if (!isAuthenticated) return <Loading text="Checking authentication..." />;
  if (isLoading) return <Loading text="Loading your groups..." />;

  const totalGroups = groups?.length ?? 0;
  const shownCount = filteredAndSorted.length;

  // Aggregate header stats
  const totalSpendAll = groups?.reduce((s, g) => s + Number(g.total_spend ?? 0), 0) ?? 0;
  const totalMembersAll = groups?.reduce((s, g) => s + Number(g.member_count ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen relative">
      <SpaceSky />
      <Topbar />

      <main className="relative z-10 w-full px-4 md:px-6 lg:px-8 py-8 max-w-screen-2xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
                {user?.usernm || 'there'}
              </span>{' '}
              👋
            </h1>
            <p className="text-muted-foreground text-sm">
              {totalGroups === 0
                ? 'Create your first expense group to get started'
                : `${totalGroups} group${totalGroups !== 1 ? 's' : ''} · ${totalMembersAll} members total`}
            </p>
          </div>
          {/* Quick stats pill */}
          {totalGroups > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-card/70 dark:bg-card/50 backdrop-blur border border-border/50 shadow-sm shrink-0">
              <div className="text-center">
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Total Spend</p>
                <p className="text-sm font-bold text-primary">{totalSpendAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <div className="text-center">
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Groups</p>
                <p className="text-sm font-bold">{totalGroups}</p>
              </div>
              <div className="w-px h-8 bg-border/60" />
              <Button asChild size="sm" className="h-8 px-3 text-xs gap-1.5">
                <Link href="/groups/create"><Plus className="h-3.5 w-3.5" />New</Link>
              </Button>
            </div>
          )}
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        {totalGroups > 0 && (
          <div className="flex flex-col sm:flex-row gap-2.5 mb-7">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-card/60 backdrop-blur-sm h-9 text-sm"
                placeholder="Search groups…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full sm:w-40 bg-card/60 backdrop-blur-sm h-9 text-sm">
                <SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40 bg-card/60 backdrop-blur-sm h-9 text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ── Groups Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {/* Create card */}
          <Link href="/groups/create">
            <motion.div
              whileHover={{ y: -4 }}
              className="h-full min-h-[220px] rounded-2xl border-2 border-dashed border-primary/25 hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 cursor-pointer backdrop-blur-sm bg-card/30 flex flex-col items-center justify-center gap-4 p-8 group/create"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 group-hover/create:from-primary/30 group-hover/create:to-purple-500/30 flex items-center justify-center transition-all duration-300 border border-primary/20">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Create New Group</p>
                <p className="text-xs text-muted-foreground mt-1">Track expenses with friends</p>
              </div>
            </motion.div>
          </Link>

          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((group, i) => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
                className="h-full"
              >
                <GroupCard group={group} index={i} onDelete={setDeleteTarget} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No results */}
        {totalGroups > 0 && shownCount === 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col items-center gap-3 p-10 rounded-2xl bg-card/70 backdrop-blur border border-border/50">
              <Search className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-semibold">No groups match your search</p>
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterBy('all'); }}>Clear filters</Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalGroups === 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col items-center gap-5 p-14 rounded-3xl bg-card/70 backdrop-blur border border-border/50">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/20">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">No Groups Yet</h2>
                <p className="text-muted-foreground text-sm">Create your first group to start tracking expenses together</p>
              </div>
              <Button asChild size="lg" className="gap-2">
                <Link href="/groups/create"><Plus className="h-5 w-5" />Create Your First Group</Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Delete dialog */}
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
            Are you sure you want to delete <span className="font-semibold">{deleteTarget?.grp_name}</span>?
            All members and trips will be permanently removed.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
