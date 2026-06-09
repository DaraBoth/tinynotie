'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Users, Trash2, AlertTriangle, Search,
  Users2, TrendingUp, ChevronRight, Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { api } from '@/api/apiClient';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/Loading';
import { SpaceSky } from '@/components/SpaceSky';
import { Topbar } from '@/components/global/Topbar';
import { MobilePullToRefresh } from '@/components/MobilePullToRefresh';
import { CURRENCY_NAMES } from '@/utils/helpers';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const ACCENT_COLORS = [
  { bg: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-500' },
  { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
  { bg: 'bg-violet-500', gradient: 'from-violet-500 to-purple-500' },
  { bg: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' },
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
  const currencyLabel = CURRENCY_NAMES[currencySymbol] || currencySymbol;
  const isPublicPreview = group.visibility === 'public' && !group.isMember && !group.isAdmin;
  const memberCount = Number(group.member_count ?? 0);
  const tripCount = Number(group.trip_count ?? 0);
  const totalSpend = isPublicPreview ? 0 : Number(group.total_spend ?? 0);
  const totalPaid = isPublicPreview ? 0 : Number(group.total_paid ?? 0);
  const balance = totalPaid - totalSpend;
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <motion.div
      layout
      className="relative group/card h-full"
    >
      <Link href={`/groups/${group.id}`} className="block relative h-full">
        <div className="relative h-full glass-card border-border/20 overflow-hidden group-hover/card:border-border/40 p-5 flex flex-col justify-between transition-all duration-200 md:hover:scale-[1.01]">

          {/* Top accent bar */}
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accent.gradient} opacity-70 group-hover/card:opacity-100 transition-opacity`} />

          <div>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${accent.bg} bg-opacity-15 flex items-center justify-center`}>
                <Users2 className={`h-5 w-5 text-white`} />
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                {group.isAdmin && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-2 rounded-md font-semibold">
                    Admin
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium text-muted-foreground">
                  {group.visibility === 'public' ? 'Public' : 'Private'}
                </Badge>
              </div>
            </div>

            <h3 className="text-base font-bold text-foreground mb-0.5 line-clamp-1">
              {group.grp_name}
            </h3>
            <p className="text-[10px] text-muted-foreground mb-4">{currencyLabel}</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2.5 rounded-lg bg-foreground/5 border border-border/10">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Total spent</p>
                <p className="text-sm font-semibold text-foreground">{isPublicPreview ? '—' : formatMoney(totalSpend, currencySymbol)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-foreground/5 border border-border/10">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Balance</p>
                <p className={`text-sm font-semibold ${isPublicPreview ? 'text-muted-foreground' : balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isPublicPreview ? '—' : balance >= 0 ? 'Settled' : 'Owed'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/10 mt-auto">
            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 opacity-50" /> {memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 opacity-50" /> {tripCount} expenses
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </Link>

      {group.isAdmin && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete({ id: group.id, grp_name: group.grp_name }); }}
          className="absolute top-3 right-3 z-20 opacity-0 pointer-events-none md:group-hover/card:opacity-100 md:group-hover/card:pointer-events-auto p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all border-none"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}

export function HomePageClient({ initialGroups = null, initialUser = null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasHydrated, isAuthenticated, user } = useAuthGuard();
  const activeUser = user || initialUser;
  const activeUserId = activeUser?._id || activeUser?.id || null;
  const hasSSRData = !!(initialUser && Array.isArray(initialGroups));
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ['groupsWithDetails', activeUserId],
    queryFn: async () => {
      const response = await api.getGroupsWithDetails(activeUserId);
      return response.data.data || [];
    },
    enabled: hasHydrated && isAuthenticated && !!activeUserId,
    initialData: Array.isArray(initialGroups) ? initialGroups : undefined,
    staleTime: 30 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId) => api.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupsWithDetails', activeUserId] });
      toast.success('Group deleted.');
      setDeleteTarget(null);
    },
  });

  const filtered = useMemo(() => {
    if (!groups) return [];
    let result = [...groups];
    if (filterBy === 'admin') result = result.filter((g) => g.isAdmin);
    else if (filterBy === 'member') result = result.filter((g) => g.isMember && !g.isAdmin);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) => g.grp_name.toLowerCase().includes(q));
    }
    result.sort((a, b) => new Date(b.create_date) - new Date(a.create_date));
    return result;
  }, [groups, search, filterBy]);

  // Group totals by currency
  const currencyTotals = useMemo(() => {
    if (!groups) return {};
    return groups.reduce((acc, g) => {
      const isPublicPreview = g.visibility === 'public' && !g.isMember && !g.isAdmin;
      if (isPublicPreview) return acc;
      const sym = g.currency || '$';
      acc[sym] = (acc[sym] || 0) + Number(g.total_spend ?? 0);
      return acc;
    }, {});
  }, [groups]);

  if ((!hasHydrated || !isAuthenticated) && !hasSSRData) return <Loading text="Checking authentication..." />;
  if (isLoading && !Array.isArray(groups)) return <Loading text="Loading your groups..." />;

  const handlePullToRefresh = async () => {
    await refetch();
  };

  return (
    <div className="min-h-screen relative bg-background pb-24 selection:bg-primary selection:text-primary-foreground">
      <MobilePullToRefresh onRefresh={handlePullToRefresh} enabled={!!isAuthenticated} />
      <SpaceSky />
      <Topbar />

      <main className="relative z-10 w-full px-6 py-12 max-w-7xl mx-auto">
        {/* ── GenZ Dashboard Header ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-20 items-end">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight leading-tight">
                <span className="text-muted-foreground">Welcome,</span>{' '}
                <span className="text-foreground inline-block max-w-full break-all [overflow-wrap:anywhere]">{activeUser?.usernm || 'User'}</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm">
                You have <span className="text-foreground font-semibold">{groups?.length || 0} group{groups?.length !== 1 ? 's' : ''}</span>.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 relative group"
          >
            <div className="absolute inset-0 bg-[#f78fa7]/5 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
            <div className="relative glass-card border-border/10 p-8 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center border border-border/10 group-hover:rotate-6 transition-transform">
                  <Coins className="h-6 w-6 text-[#f78fa7]" />
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase font-black text-foreground/20 tracking-[.3em] mb-1">Status</p>
                  <Badge variant="outline" className="text-[10px] px-2">Overview</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground mb-4">Total Spending</p>
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(currencyTotals).length > 0 ? (
                    Object.entries(currencyTotals).map(([sym, total]) => (
                      <div key={sym} className="group/item border-l border-foreground/5 pl-4 py-1">
                        <p className="text-[10px] font-black text-muted-foreground/60 mb-1 flex items-center gap-2 italic uppercase tracking-tighter">
                          {CURRENCY_NAMES[sym] || sym}
                        </p>
                        <h2 className="text-xl font-black text-foreground tabular-nums tracking-tighter">
                          {formatMoney(total, sym)}
                        </h2>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-[9px] font-black italic uppercase">No Data Found</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Control Bar ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#f78fa7] transition-colors" />
            <Input
              className="pl-12 h-12 rounded-2xl bg-foreground/5 border-border/10 focus:border-[#f78fa7]/40 backdrop-blur-3xl transition-all text-sm font-bold placeholder:text-muted-foreground placeholder:uppercase placeholder:italic"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="h-12 rounded-2xl bg-foreground/5 text-muted-foreground border-border/10 flex-1 md:w-48 font-black uppercase text-[10px] italic tracking-widest hover:text-foreground transition-colors">
                <SelectValue placeholder="Vibe Check" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border rounded-2xl">
                <SelectItem value="all">Show All</SelectItem>
                <SelectItem value="admin">My Groups</SelectItem>
                <SelectItem value="member">Groups I'm In</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild className="h-12 w-12 md:w-auto md:px-6 rounded-2xl bg-[#f78fa7] hover:bg-[#f78fa7]/90 text-black font-black uppercase italic tracking-tighter gap-2 shadow-[0_0_20px_rgba(128,255,0,0.2)] group">
              <Link href="/groups/create" className="flex items-center">
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                <span className="hidden md:inline text-[11px]">New Group</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ── The Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((group, i) => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: Math.min(i * 0.05, 0.5) }}
              >
                <GroupCard group={group} index={i} onDelete={setDeleteTarget} />
              </motion.div>
            ))}
          </AnimatePresence>

        </div>

        {/* Empty State */}
        {groups?.length > 0 && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center">
            <p className="text-lg text-muted-foreground">No groups found.</p>
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-popover border border-border rounded-[2.5rem] p-10">
          <DialogHeader>
            <div className="w-16 h-16 rounded-[2rem] bg-[#ff0080]/20 flex items-center justify-center mb-6 border border-[#ff0080]/30">
              <AlertTriangle className="h-8 w-8 text-[#ff0080]" />
            </div>
            <DialogTitle className="text-xl font-bold">Delete group?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Deleting <span className="text-foreground font-semibold">{deleteTarget?.grp_name}</span> is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-8">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-12 rounded-xl font-semibold">Cancel</Button>
            <Button variant="destructive" className="h-12 rounded-xl font-semibold" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Vibes' },
  { value: 'admin', label: 'My Squads' },
  { value: 'member', label: 'Vibe Guest List' },
];