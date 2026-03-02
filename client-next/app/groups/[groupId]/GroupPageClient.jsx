'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid, List, MessageSquare, Settings, ArrowLeft,
  Share2, UserPlus, Plus, Pencil, Trash2, Users,
  Wallet, TrendingUp, Clock, BadgeCheck, ScanLine, X, ChevronDown,
} from 'lucide-react';

import { api } from '@/api/apiClient';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/Loading';
import { SpaceSky } from '@/components/SpaceSky';
import { Topbar } from '@/components/global/Topbar';
import { EditMember } from '@/components/EditMember';
import { EditTrip } from '@/components/EditTrip';
import { DeleteMember } from '@/components/DeleteMember';
import { ChatWithDatabase } from '@/components/ChatWithDatabase';
import { ShareModal } from '@/components/ShareModal';
import { GroupVisibilitySettings } from '@/components/GroupVisibilitySettings';
import { ReceiptScanner } from '@/components/ReceiptScanner';
import { calculateMoney, formatTimeDifference } from '@/utils/helpers';

/* ─── tiny helper ────────────────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, color = 'text-foreground' }) {
  const bgMap = {
    'text-green-400': 'bg-green-500/10',
    'text-orange-400': 'bg-orange-500/10',
    'text-red-400': 'bg-red-500/10',
    'text-blue-400': 'bg-blue-500/10',
  };
  const bg = bgMap[color] || 'bg-primary/10';
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-background/30 dark:bg-white/5 border border-border/30 backdrop-blur-sm shrink-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className={`text-sm font-bold leading-none ${color}`}>{value ?? '—'}</p>
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */
export function GroupPageClient({ groupId }) {
  const router = useRouter();
  const { hasHydrated, isAuthenticated, user } = useAuthGuard();
  const { isMobile } = useWindowDimensions();

  const [viewMode, setViewMode] = useState('table');
  const [mobileTab, setMobileTab] = useState('members');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [editMemberMode, setEditMemberMode] = useState(false); // false=add, true=edit
  const [editTripOpen, setEditTripOpen] = useState(false);
  const [deleteMemberOpen, setDeleteMemberOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  const openPanel = (action) => {
    setFabOpen(false);
    action();
  };

  const { data: groupData, isLoading, error } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const [groupResponse, membersResponse, tripsResponse] = await Promise.all([
        api.getGroupById(groupId, user?._id),
        api.getMembersByGroupId(groupId),
        api.getTripsByGroupId(groupId),
      ]);
      return {
        group: groupResponse.data.data || {},
        members: membersResponse.data.data || [],
        trips: tripsResponse.data.data || [],
      };
    },
    enabled: hasHydrated && isAuthenticated && !!groupId && !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    setViewMode(isMobile ? 'list' : 'table');
  }, [isMobile]);

  /* ── guards ── */
  if (!hasHydrated || !isAuthenticated) return <Loading text="Checking authentication..." />;
  if (isLoading) return <Loading text="Loading group..." />;

  if (error) {
    return (
      <div className="min-h-screen relative">
        <SpaceSky />
        <Topbar />
        <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-destructive font-semibold">Failed to load group</p>
            <Button onClick={() => router.push('/home')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── data ── */
  const group = groupData?.group || {};
  const members = groupData?.members || [];
  const trips = groupData?.trips || [];
  const currency = group.currency || '$';

  const { info, newData } = calculateMoney(members, trips, currency);

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.update_dttm || b.create_date) - new Date(a.update_dttm || a.create_date)
  );

  const getPayerName = (trip) => {
    if (!trip.payer_id) return '—';
    const m = members.find((m) => m.id === Number(trip.payer_id));
    return m ? m.mem_name : '—';
  };

  const getMemberCount = (trip) => {
    try {
      const ids = JSON.parse(trip.mem_id);
      return Array.isArray(ids) ? ids.length : 1;
    } catch { return 1; }
  };

  const tripColumns = trips.map((t) => t.trp_name);

  /* ── avatar color helper ── */
  const AVATAR_COLORS = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-lime-500',
  ];
  const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const avatarInitials = (name = '') => name.slice(0, 2).toUpperCase();

  /* ── sub-sections ── */

  const ContributionsSection = (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> Member Contributions
        </h2>
        <div className="flex gap-0.5 bg-muted/60 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="h-3 w-3" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <List className="h-3 w-3" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/40 rounded-2xl">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No members yet</p>
          <Button size="sm" variant="outline" className="mt-4"
            onClick={() => { setSelectedMember(null); setEditMemberOpen(true); }}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Add First Member
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-border/30 bg-background/20 backdrop-blur-sm">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide w-8">#</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Name</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Paid</th>
                {tripColumns.map((name) => (
                  <th key={name} className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide max-w-[100px]">
                    <span className="block truncate" title={name}>{name}</span>
                  </th>
                ))}
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Remain</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">Unpaid</th>
              </tr>
            </thead>
            <tbody>
              {newData.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold">{row.name}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">{row.paid}</td>
                  {tripColumns.map((name) => (
                    <td key={name} className="px-4 py-3 text-right text-orange-400 text-sm">{row[name] ?? '—'}</td>
                  ))}
                  <td className={`px-4 py-3 text-right font-semibold ${String(row.remain).startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>{row.remain}</td>
                  <td className="px-4 py-3 text-right text-red-400">{row.unpaid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {newData.map((row, idx) => (
            <div key={row.id || idx} className="border border-border/30 rounded-xl p-4 bg-background/20 backdrop-blur-sm hover:bg-muted/20 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold">{row.name}</span>
                <Badge variant="outline" className="text-xs font-normal">#{idx + 1}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wide block mb-0.5">Paid</span>
                  <span className="text-green-400 font-semibold">{row.paid}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wide block mb-0.5">Remain</span>
                  <span className={`font-semibold ${String(row.remain).startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>{row.remain}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wide block mb-0.5">Unpaid</span>
                  <span className="text-red-400 font-semibold">{row.unpaid}</span>
                </div>
              </div>
              {tripColumns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-1.5">
                  {tripColumns.map((name) => (
                    <span key={name} className="text-xs bg-muted/60 rounded-lg px-2 py-1">
                      <span className="text-muted-foreground">{name}:</span>{' '}
                      <span className="text-orange-400 font-medium">{row[name] ?? '—'}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const TripsSection = (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" /> Trips
        </h2>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => { setSelectedTrip(null); setEditTripOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Trip
        </Button>
      </div>
      {sortedTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/40 rounded-2xl">
          <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No trips yet</p>
          <Button size="sm" variant="outline" className="mt-4"
            onClick={() => { setSelectedTrip(null); setEditTripOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add First Trip
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/30 bg-background/20 backdrop-blur-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Name</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Amount</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium text-[11px] uppercase tracking-wide hidden sm:table-cell">Payer</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium text-[11px] uppercase tracking-wide hidden sm:table-cell">Mbrs</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium text-[11px] uppercase tracking-wide">Updated</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrips.map((trip, idx) => (
                <tr key={trip.id || idx}
                  className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => { setSelectedTrip(trip); setEditTripOpen(true); }}>
                  <td className="px-3 py-2.5 font-medium truncate max-w-[120px]" title={trip.trp_name}>{trip.trp_name}</td>
                  <td className="px-3 py-2.5 text-right text-green-400 font-semibold">{currency}{parseFloat(trip.spend || 0).toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground hidden sm:table-cell">{getPayerName(trip)}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground hidden sm:table-cell">{getMemberCount(trip)}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground text-xs">{formatTimeDifference(trip.update_dttm || trip.create_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const SummarySection = (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
        <Wallet className="h-3.5 w-3.5" /> Summary
      </h2>
      <div className="rounded-xl border border-border/30 bg-background/20 backdrop-blur-sm overflow-hidden">
        {[
          { label: 'Total Members', value: info.totalMember, color: 'text-foreground' },
          { label: 'Total Paid', value: info.totalPaid, color: 'text-green-400' },
          { label: 'Total Spend', value: info.totalSpend, color: 'text-orange-400' },
          { label: 'Total Remain', value: info.totalRemain, color: 'text-blue-400' },
          { label: 'Total Unpaid', value: info.totalUnPaid, color: 'text-red-400' },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} className={`flex justify-between items-center px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-border/20' : ''} hover:bg-muted/20 transition-colors`}>
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className={`font-bold text-sm ${color}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── render ── */
  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <SpaceSky />
      <Topbar />

      <div className="relative z-10 flex flex-col flex-1 w-full">

        {/* Sticky Header Section */}
        <div className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/30">
          <header className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-3">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.push('/home')}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate flex-1">
                {group.grp_name || 'Group'}
              </h1>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setShareOpen(true)} title="Share">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setChatOpen(true)} title="AI Chat">
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSettingsOpen(true)} title="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action row — hidden on mobile (FAB handles those) */}
            <div className="hidden md:flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs"
                onClick={() => { setEditMemberMode(false); setSelectedMember(null); setEditMemberOpen(true); }}>
                <UserPlus className="h-3.5 w-3.5" /> Add Member
              </Button>
              <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs"
                onClick={() => { setSelectedTrip(null); setEditTripOpen(true); }}>
                <Plus className="h-3.5 w-3.5" /> Add Trip
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                onClick={() => setScannerOpen(true)}>
                <ScanLine className="h-3.5 w-3.5" /> Scan Receipt
              </Button>
              {members.length > 0 && (
                <>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                    onClick={() => { setEditMemberMode(true); setSelectedMember(null); setEditMemberOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" /> Edit Member
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => { setSelectedMember(null); setDeleteMemberOpen(true); }}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </>
              )}
            </div>
          </header>

          {/* Desktop-only stat pills strip */}
          <div className="hidden md:block w-full px-4 sm:px-6 lg:px-8 py-3 border-t border-border/10">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              <StatPill icon={Users} label="Members" value={info.totalMember} />
              <StatPill icon={BadgeCheck} label="Total Paid" value={info.totalPaid} color="text-green-400" />
              <StatPill icon={TrendingUp} label="Total Spend" value={info.totalSpend} color="text-orange-400" />
              <StatPill icon={Wallet} label="Remain" value={info.totalRemain} color="text-blue-400" />
              <StatPill icon={Clock} label="Unpaid" value={info.totalUnPaid} color="text-red-400" />
            </div>
          </div>
        </div>

        {/* Content starts below sticky section */}

        {/* Mobile Hero Balance Card */}
        <div className="md:hidden px-4 pt-4 pb-2">
          <div className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #1e1b4b 100%)' }}>
            {/* Decorative blur orbs */}
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-violet-400/10 blur-xl" />
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold mb-1">Total Spend</p>
            <p className="text-white text-4xl font-extrabold tracking-tight mb-4">{info.totalSpend}</p>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2 text-center">
                <p className="text-[9px] uppercase tracking-widest text-white/50 mb-0.5">Paid</p>
                <p className="text-green-300 font-bold text-sm">{info.totalPaid}</p>
              </div>
              <div className="flex-1 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2 text-center">
                <p className="text-[9px] uppercase tracking-widest text-white/50 mb-0.5">Remain</p>
                <p className="text-blue-300 font-bold text-sm">{info.totalRemain}</p>
              </div>
              <div className="flex-1 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2 text-center">
                <p className="text-[9px] uppercase tracking-widest text-white/50 mb-0.5">Unpaid</p>
                <p className="text-red-300 font-bold text-sm">{info.totalUnPaid}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4">

          {/* Mobile tab bar */}
          <div className="flex md:hidden gap-0.5 mb-4 w-full border-b border-border/20">
            {[
              { key: 'members', label: 'Members', icon: Users },
              { key: 'trips', label: 'Trips', icon: TrendingUp },
              { key: 'summary', label: 'Summary', icon: Wallet },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMobileTab(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${mobileTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Mobile view */}
          <div className="md:hidden">

            {/* Members tab — expandable accordion cards */}
            {mobileTab === 'members' && (
              <div>
                {members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/40 rounded-2xl">
                    <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">No members yet</p>
                    <Button size="sm" variant="outline" className="mt-4"
                      onClick={() => { setSelectedMember(null); setEditMemberOpen(true); }}>
                      <UserPlus className="h-4 w-4 mr-1.5" /> Add First Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {newData.map((row, idx) => {
                      const member = members[idx];
                      const isPaid = !String(row.unpaid).replace(/[^0-9.-]/g, '') || parseFloat(String(row.unpaid).replace(/[^0-9.-]/g, '')) === 0;
                      const isExpanded = expandedMemberId === (row.id ?? idx);
                      // trips this member joined, with their spend amount
                      const memberTrips = tripColumns
                        .map(name => ({ name, amount: row[name] }))
                        .filter(t => t.amount && t.amount !== '—');

                      return (
                        <div key={row.id || idx}
                          className={`rounded-2xl border transition-all overflow-hidden ${isExpanded
                              ? 'border-primary/40 bg-background/50'
                              : 'border-border/20 bg-background/30'
                            }`}
                        >
                          {/* Header row — always visible */}
                          <button
                            className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-muted/30 transition-colors text-left"
                            onClick={() => setExpandedMemberId(isExpanded ? null : (row.id ?? idx))}
                          >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm ${avatarColor(row.name)}`}>
                              {avatarInitials(row.name)}
                            </div>
                            {/* Name + status */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{row.name}</p>
                              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${isPaid
                                  ? 'bg-green-500/15 text-green-400'
                                  : 'bg-red-500/15 text-red-400'
                                }`}>
                                {isPaid ? 'PAID' : 'UNPAID'}
                              </span>
                            </div>
                            {/* Amount + chevron */}
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <div>
                                <p className="text-sm font-bold text-green-400">{row.paid}</p>
                                {!isPaid && <p className="text-xs text-red-400">{row.unpaid} due</p>}
                              </div>
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                }`} />
                            </div>
                          </button>

                          {/* Expanded trip breakdown */}
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              {/* Trip list */}
                              {memberTrips.length > 0 ? (
                                <div className="rounded-xl bg-muted/30 border border-border/20 overflow-hidden mb-3">
                                  <p className="px-3 pt-2.5 pb-1.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                                    Trips Joined ({memberTrips.length})
                                  </p>
                                  {memberTrips.map((t, i) => (
                                    <div key={t.name}
                                      className={`flex items-center justify-between px-3 py-2.5 ${i < memberTrips.length - 1 ? 'border-b border-border/20' : ''
                                        }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                        <span className="text-sm truncate max-w-[160px]">{t.name}</span>
                                      </div>
                                      <span className="text-sm font-semibold text-orange-400">{t.amount}</span>
                                    </div>
                                  ))}
                                  {/* Totals row */}
                                  <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30 border-t border-border/20">
                                    <span className="text-xs text-muted-foreground font-semibold">Total Spent</span>
                                    <span className="text-sm font-bold text-foreground">{row.paid}</span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground mb-3 py-2">No trips joined yet.</p>
                              )}

                              {/* Quick stats row */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2">
                                  <p className="text-[9px] uppercase tracking-widest text-green-400/70 mb-0.5">Paid</p>
                                  <p className="text-sm font-bold text-green-400">{row.paid}</p>
                                </div>
                                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                                  <p className="text-[9px] uppercase tracking-widest text-blue-400/70 mb-0.5">Remain</p>
                                  <p className="text-sm font-bold text-blue-400">{row.remain}</p>
                                </div>
                              </div>

                              {/* Edit button */}
                              <button
                                onClick={() => { setSelectedMember(member); setEditMemberMode(true); setEditMemberOpen(true); }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/30 bg-muted/30 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-95"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit Member
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Trips tab */}
            {mobileTab === 'trips' && TripsSection}

            {/* Summary tab */}
            {mobileTab === 'summary' && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/30 bg-background/30 overflow-hidden">
                  {[
                    { label: 'Total Members', value: info.totalMember, color: 'text-foreground' },
                    { label: 'Total Paid', value: info.totalPaid, color: 'text-green-400' },
                    { label: 'Total Spend', value: info.totalSpend, color: 'text-orange-400' },
                    { label: 'Total Remain', value: info.totalRemain, color: 'text-blue-400' },
                    { label: 'Total Unpaid', value: info.totalUnPaid, color: 'text-red-400' },
                  ].map(({ label, value, color }, i, arr) => (
                    <div key={label} className={`flex justify-between items-center px-5 py-4 ${i < arr.length - 1 ? 'border-b border-border/20' : ''
                      }`}>
                      <span className="text-muted-foreground text-sm">{label}</span>
                      <span className={`font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop two-column */}
          <div className="hidden md:grid md:grid-cols-12 gap-6">
            <div className="md:col-span-8 space-y-6">
              {ContributionsSection}
            </div>
            <div className="md:col-span-4 space-y-6">
              {TripsSection}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile FAB + Bottom Action Sheet (mobile only) ───────────────── */}

      {/* Backdrop / scrim */}
      {fabOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Bottom Action Sheet */}
      <div
        className={`md:hidden fixed left-0 right-0 z-50 transition-all duration-300 ease-out ${fabOpen ? 'bottom-0' : '-bottom-full'
          }`}
      >
        <div className="bg-background/98 backdrop-blur-xl rounded-t-3xl border-t border-border/30 shadow-2xl pb-safe">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          {/* Sheet title */}
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground px-6 pb-4 pt-2">
            Actions
          </p>

          {/* Action grid — 3 columns */}
          <div className="grid grid-cols-3 gap-1 px-4 pb-6">
            {/* Add Member */}
            <button
              onClick={() => openPanel(() => { setEditMemberMode(false); setSelectedMember(null); setEditMemberOpen(true); })}
              className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-semibold text-center leading-tight">Add Member</span>
            </button>

            {/* Add Trip */}
            <button
              onClick={() => openPanel(() => { setSelectedTrip(null); setEditTripOpen(true); })}
              className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-semibold text-center leading-tight">Add Trip</span>
            </button>

            {/* Scan Receipt */}
            <button
              onClick={() => openPanel(() => setScannerOpen(true))}
              className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                <ScanLine className="h-6 w-6 text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-center leading-tight">Scan Receipt</span>
            </button>

            {members.length > 0 && (
              <>
                {/* Edit Member */}
                <button
                  onClick={() => openPanel(() => { setEditMemberMode(true); setSelectedMember(null); setEditMemberOpen(true); })}
                  className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                    <Pencil className="h-6 w-6 text-amber-400" />
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight">Edit Member</span>
                </button>

                {/* Delete */}
                <button
                  onClick={() => openPanel(() => { setSelectedMember(null); setDeleteMemberOpen(true); })}
                  className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors">
                  <div className="w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-destructive" />
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight text-destructive">Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAB button */}
      <button
        onClick={() => setFabOpen((o) => !o)}
        className={`md:hidden fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 ${fabOpen
          ? 'bg-foreground text-background rotate-45'
          : 'bg-primary text-primary-foreground'
          }`}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Panels & Dialogs */}
      <EditMember open={editMemberOpen} onClose={() => setEditMemberOpen(false)} groupId={groupId} member={selectedMember} members={members} editMode={editMemberMode} currency={currency} />
      <EditTrip open={editTripOpen} onClose={() => setEditTripOpen(false)} groupId={groupId} trip={selectedTrip} members={members} currency={currency} />
      <DeleteMember open={deleteMemberOpen} onClose={() => setDeleteMemberOpen(false)} groupId={groupId} member={selectedMember} members={members} trips={trips} />
      <ChatWithDatabase open={chatOpen} onClose={() => setChatOpen(false)} groupId={groupId} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} group={group} members={members} trips={trips} currency={currency} />
      <GroupVisibilitySettings open={settingsOpen} onClose={() => setSettingsOpen(false)} group={group} groupId={groupId} />
      <ReceiptScanner open={scannerOpen} onClose={() => setScannerOpen(false)} groupId={groupId} members={members} />
    </div>
  );
}
