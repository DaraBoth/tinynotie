'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Users, Trash2, AlertTriangle, Search,
  Users2, TrendingUp, DollarSign, Calendar, Crown, Globe, Lock, ChevronRight,
  ArrowUpRight, Wallet
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
import { CURRENCY_NAMES } from '@/utils/helpers';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Premium colour gradients for accent bars
const ACCENT_GRADIENTS = [
  'from-violet-600 via-indigo-500 to-cyan-400',
  'from-emerald-500 via-teal-400 to-sky-400',
  'from-orange-500 via-amber-400 to-yellow-300',
  'from-rose-500 via-pink-400 to-fuchsia-400',
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
  const memberCount = Number(group.member_count ?? 0);
  const tripCount = Number(group.trip_count ?? 0);
  const totalSpend = Number(group.total_spend ?? 0);
  const totalPaid = Number(group.total_paid ?? 0);
  const balance = totalPaid - totalSpend;
  const accent = ACCENT_GRADIENTS[index % ACCENT_GRADIENTS.length];

  return (
    <motion.div
      layout
      className="relative group/card h-full"
    >
      <Link href={`/groups/${group.id}`} className="block relative h-full">
        <div className="relative h-full glass-card border-white/5 overflow-hidden group-hover/card:border-white/20 p-6 flex flex-col justify-between">

          {/* Subtle Accent Glow */}
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accent} opacity-50 group-hover/card:opacity-100 transition-opacity`} />
          <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${accent} blur-3xl opacity-0 group-hover/card:opacity-20 transition-opacity duration-700`} />

          <div>
            <div className="flex items-start justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-lg`}>
                <Users2 className="h-6 w-6" />
              </div>
              <div className="flex gap-1.5 justify-end">
                {group.isAdmin && (
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-0">
                    <Crown className="h-3 w-3 mr-1" /> Admin
                  </Badge>
                )}
                <Badge variant="outline" className="border-white/10 text-white/50 text-[10px] py-0 backdrop-blur-md">
                  {group.visibility === 'public' ? <Globe className="h-2.5 w-2.5 mr-1" /> : <Lock className="h-2.5 w-2.5 mr-1" />}
                  {group.visibility === 'public' ? 'Public' : 'Private'}
                </Badge>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 tracking-tight">
              {group.grp_name}
            </h3>
            <p className="text-xs text-muted-foreground font-medium mb-6 uppercase tracking-wider">{currencyLabel}</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Spent</p>
                <p className="text-sm font-bold text-white">{formatMoney(totalSpend, currencySymbol)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Balance</p>
                <p className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {balance >= 0 ? '+' : ''}{formatMoney(balance, currencySymbol)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
            <div className="flex items-center gap-4 text-white/40 text-xs">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> {memberCount}
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> {tripCount}
              </span>
            </div>
            <div className="p-2 rounded-full bg-white/5 group-hover/card:bg-primary/20 transition-colors">
              <ChevronRight className="h-4 w-4 text-white/50 group-hover/card:text-white" />
            </div>
          </div>
        </div>
      </Link>

      {group.isAdmin && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete({ id: group.id, grp_name: group.grp_name }); }}
          className="absolute top-4 right-4 z-20 opacity-0 group-hover/card:opacity-100 p-2 rounded-xl glass-button text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all border-none"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasHydrated, isAuthenticated, user } = useAuthGuard();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterBy, setFilterBy] = useState('all');

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groupsWithDetails', user?._id],
    queryFn: async () => {
      const response = await api.getGroupsWithDetails(user._id);
      return response.data.data || [];
    },
    enabled: hasHydrated && isAuthenticated && !!user?._id,
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId) => api.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupsWithDetails', user?._id] });
      toast.success('Group deleted');
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
      case 'date-asc': result.sort((a, b) => new Date(a.create_date) - new Date(b.create_date)); break;
      case 'date-desc': result.sort((a, b) => new Date(b.create_date) - new Date(a.create_date)); break;
      case 'name-asc': result.sort((a, b) => a.grp_name.localeCompare(b.grp_name)); break;
      case 'name-desc': result.sort((a, b) => b.grp_name.localeCompare(a.grp_name)); break;
    }
    return result;
  }, [groups, search, sortBy, filterBy]);

  if (!hasHydrated || !isAuthenticated) return <Loading text="Authenticating..." />;
  if (isLoading) return <Loading text="Waking up the server..." />;

  const totalSpendAll = groups?.reduce((s, g) => s + Number(g.total_spend ?? 0), 0) ?? 0;
  const totalGroups = groups?.length ?? 0;

  return (
    <div className="min-h-screen relative bg-[#050508] pb-20">
      <SpaceSky />
      <Topbar />

      <main className="relative z-10 w-full px-6 py-12 max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-8 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tighter">
                Hello, <span className="text-gradient-vibrant animate-gradient">{user?.usernm || 'Explorer'}</span>
              </h1>
              <p className="text-muted-foreground text-lg font-medium max-w-md">
                You're managing {totalGroups} active groups. Here's your financial overview.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 glass-card p-1 shadow-2xl overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/30" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em] mb-1">Total Group Spend</p>
                <h2 className="text-4xl font-black text-white tabular-nums tracking-tighter">
                  ${totalSpendAll.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[9px] uppercase font-bold text-white/40 mb-1">Total Groups</p>
                  <p className="text-xl font-black text-white">{totalGroups}</p>
                </div>
                <div className="pt-4 border-t border-white/10 text-right">
                  <p className="text-[9px] uppercase font-bold text-white/40 mb-1">Trip Events</p>
                  <p className="text-xl font-black text-white">
                    {groups?.reduce((s, g) => s + Number(g.trip_count ?? 0), 0) ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Control Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
            <Input
              className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 backdrop-blur-md transition-all text-base"
              placeholder="Search groups by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="h-12 rounded-2xl glass-button text-white border-white/10 flex-1 md:w-44">
                <SelectValue placeholder="All Activity" />
              </SelectTrigger>
              <SelectContent className="bg-[#121218] border-white/10">
                {FILTER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="text-white hover:bg-white/5">{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button asChild className="h-12 w-12 md:w-auto md:px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold gap-2">
              <Link href="/groups/create">
                <Plus className="h-5 w-5" />
                <span className="hidden md:inline">Create Group</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((group, i) => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
              >
                <GroupCard group={group} index={i} onDelete={setDeleteTarget} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Create Shortcut Card */}
          <Link href="/groups/create" className="h-full min-h-[260px]">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full rounded-3xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center p-8 group/new"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover/new:scale-110 group-hover/new:bg-primary/20 transition-all border border-white/10">
                <Plus className="h-8 w-8 text-white/40 group-hover/new:text-white" />
              </div>
              <p className="font-bold text-white uppercase tracking-widest text-xs">New Group</p>
            </motion.div>
          </Link>
        </div>

        {/* Empty States */}
        {totalGroups > 0 && filteredAndSorted.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <p className="text-xl font-bold text-white/20">No matching projects found.</p>
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-[#121218] border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Destructive Action</DialogTitle>
            <DialogDescription className="text-white/50 text-base">
              You are about to permanently delete <span className="text-white font-bold">{deleteTarget?.grp_name}</span>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 h-12 rounded-2xl border-white/10 hover:bg-white/5">Cancel</Button>
            <Button variant="destructive" className="flex-1 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 font-bold" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending ? 'Processing...' : 'Delete Permanently'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Activity' },
  { value: 'admin', label: 'My Groups' },
  { value: 'member', label: 'Shared with Me' },
];
