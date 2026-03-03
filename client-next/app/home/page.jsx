'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Users, Trash2, AlertTriangle, Search,
  Users2, TrendingUp, DollarSign, Calendar, Crown, Globe, Lock, ChevronRight,
  ArrowUpRight, Wallet, Sparkles, Coins
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

// Premium GenZ colour gradients
const ACCENT_GRADIENTS = [
  'from-[#80ff00] via-[#00ff80] to-[#00ffff]', // Neon Green
  'from-[#ff0080] via-[#ff00ff] to-[#8000ff]', // Hot Pink/Purple
  'from-[#0080ff] via-[#00ffff] to-[#00ff80]', // Electric Blue
  'from-[#ffff00] via-[#ff8000] to-[#ff0000]', // Cyber Yellow/Red
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
        <div className="relative h-full glass-card border-white/5 overflow-hidden group-hover/card:border-white/20 p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:-rotate-1">

          {/* Subtle Accent Glow */}
          <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${accent} opacity-80 group-hover/card:opacity-100 transition-opacity`} />
          <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${accent} blur-3xl opacity-0 group-hover/card:opacity-30 transition-opacity duration-700`} />

          <div>
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]`}>
                <Users2 className="h-7 w-7" />
              </div>
              <div className="flex flex-col gap-2 items-end">
                {group.isAdmin && (
                  <Badge className="bg-white text-black font-black border-none text-[10px] py-0 px-2 rounded-lg">
                    CROWN
                  </Badge>
                )}
                <Badge variant="outline" className="border-white/20 text-white font-bold text-[9px] py-0 backdrop-blur-md uppercase tracking-tighter">
                  {group.visibility === 'public' ? 'Public' : 'Solo'}
                </Badge>
              </div>
            </div>

            <h3 className="text-2xl font-black text-white mb-1 line-clamp-1 tracking-tighter uppercase italic">
              {group.grp_name}
            </h3>
            <p className="text-[10px] text-white/40 font-black mb-6 uppercase tracking-widest">{currencyLabel}</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover/card:bg-white/10 transition-colors">
                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1">Spent</p>
                <p className="text-base font-black text-white italic">{formatMoney(totalSpend, currencySymbol)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover/card:bg-white/10 transition-colors">
                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1">Status</p>
                <p className={`text-base font-black italic ${balance >= 0 ? 'text-[#80ff00]' : 'text-[#ff0080]'}`}>
                  {balance >= 0 ? 'WIN' : 'OUT'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
            <div className="flex items-center gap-4 text-white/40 text-[10px] font-black uppercase italic">
              <span className="flex items-center gap-1.5">
                <Users className="h-3 w-3" /> {memberCount} PPL
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> {tripCount} EVT
              </span>
            </div>
            <div className={`p-2 rounded-xl bg-white/10 group-hover/card:bg-gradient-to-r group-hover/card:${accent} transition-all`}>
              <ChevronRight className="h-4 w-4 text-white group-hover/card:scale-125" />
            </div>
          </div>
        </div>
      </Link>

      {group.isAdmin && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete({ id: group.id, grp_name: group.grp_name }); }}
          className="absolute top-4 right-4 z-20 opacity-0 group-hover/card:opacity-100 p-2 rounded-xl glass-button text-[#ff0080] hover:bg-[#ff0080]/20 transition-all border-none"
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
      toast.success('PEACE OUT! Group deleted.');
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
      const sym = g.currency || '$';
      acc[sym] = (acc[sym] || 0) + Number(g.total_spend ?? 0);
      return acc;
    }, {});
  }, [groups]);

  if (!hasHydrated || !isAuthenticated) return <Loading text="CHECKING VIBES..." />;
  if (isLoading) return <Loading text="WAKING UP THE SERVER... RELAX." />;

  return (
    <div className="min-h-screen relative bg-[#020205] pb-24 selection:bg-[#ff0080] selection:text-white">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-purple-400 uppercase tracking-widest backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                <span>Dashboard Multi-Verse</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black mb-3 tracking-tighter uppercase italic leading-[0.85]">
                <span className="text-white">YO,</span><br />
                <span className="text-gradient-vibrant animate-gradient">{user?.usernm || 'LEGEND'}</span>
              </h1>
              <p className="text-white/40 text-xl font-black uppercase tracking-tighter max-w-sm italic">
                Destroying debts in {groups?.length || 0} active squads.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 glass-card p-1 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#80ff00]/10 to-transparent pointer-events-none group-hover:opacity-60 transition-opacity" />
            <div className="relative z-10 p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center border border-white/20 group-hover:rotate-6 transition-transform">
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black text-white/40 tracking-[.3em]">Status</p>
                  <p className="text-[#80ff00] font-black italic">OPTIMIZED</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black text-white/40 tracking-[.3em] mb-2">Wealth Map (By Currency)</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {Object.entries(currencyTotals).length > 0 ? (
                    Object.entries(currencyTotals).map(([sym, total]) => (
                      <div key={sym} className="group/item">
                        <p className="text-[11px] font-black text-white/60 mb-1 flex items-center gap-2 italic">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {CURRENCY_NAMES[sym] || sym}
                        </p>
                        <h2 className="text-2xl font-black text-white tabular-nums tracking-tighter">
                          {formatMoney(total, sym)}
                        </h2>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/20 text-xs font-black italic uppercase">No Activity Detected</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Control Bar ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="relative w-full md:max-w-xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-[#80ff00] transition-colors" />
            <Input
              className="pl-14 h-14 rounded-[1.5rem] bg-white/5 border-white/10 focus:border-[#80ff00]/50 backdrop-blur-xl transition-all text-lg font-bold placeholder:text-white/20 placeholder:uppercase placeholder:italic shadow-inner"
              placeholder="Find your squad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="h-14 rounded-[1.5rem] glass-button text-white border-white/10 flex-1 md:w-56 font-black uppercase text-xs italic tracking-widest">
                <SelectValue placeholder="Vibe Check" />
              </SelectTrigger>
              <SelectContent className="bg-[#121218] border-white/10 rounded-2xl">
                <SelectItem value="all" className="text-white/70 focus:text-white focus:bg-white/5 uppercase font-black text-[10px] italic">All Vibes</SelectItem>
                <SelectItem value="admin" className="text-white/70 focus:text-white focus:bg-white/5 uppercase font-black text-[10px] italic">Owned by Me</SelectItem>
                <SelectItem value="member" className="text-white/70 focus:text-white focus:bg-white/5 uppercase font-black text-[10px] italic">Guest List</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild className="h-14 w-14 md:w-auto md:px-8 rounded-[1.5rem] bg-white hover:bg-white/90 text-black font-black uppercase italic tracking-tighter gap-3 shadow-[0_0_30px_rgba(255,255,255,0.15)] group">
              <Link href="/groups/create" className="flex items-center">
                <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                <span className="hidden md:inline">Spawn Group</span>
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

          {/* Create Shortcut Card */}
          <Link href="/groups/create" className="h-full min-h-[300px]">
            <motion.div
              whileHover={{ scale: 0.98, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
              className="h-full rounded-[2.5rem] border-4 border-dashed border-white/5 hover:border-[#80ff00]/30 hover:bg-[#80ff00]/5 transition-all flex flex-col items-center justify-center p-10 group/new relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/0 group-hover/new:bg-white/[0.02] transition-colors" />
              <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-6 group-hover/new:rotate-12 group-hover/new:bg-[#80ff00]/20 transition-all border border-white/10">
                <Plus className="h-10 w-10 text-white/20 group-hover/new:text-[#80ff00]" />
              </div>
              <p className="font-black text-white uppercase tracking-[0.2em] text-[10px] italic">Level Up / Create</p>
            </motion.div>
          </Link>
        </div>

        {/* Empty State */}
        {groups?.length > 0 && filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center">
            <p className="text-3xl font-black text-white/10 uppercase italic">Zero vibes found.</p>
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-[#08080a] border border-white/10 text-white rounded-[2.5rem] p-10">
          <DialogHeader>
            <div className="w-16 h-16 rounded-[2rem] bg-[#ff0080]/20 flex items-center justify-center mb-6 border border-[#ff0080]/30">
              <AlertTriangle className="h-8 w-8 text-[#ff0080]" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic italic">EXTERMINATE?</DialogTitle>
            <DialogDescription className="text-white/40 text-lg font-bold">
              Deleting <span className="text-white">{deleteTarget?.grp_name}</span> is forever. No regerts?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-8">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="h-16 rounded-2xl border-white/10 hover:bg-white/5 font-black uppercase italic tracking-widest">Nah, back out</Button>
            <Button variant="destructive" className="h-16 rounded-2xl bg-[#ff0080] hover:bg-[#cc0066] font-black uppercase italic tracking-widest" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending ? 'CRUNCHING...' : 'YES, DELETE'}
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
