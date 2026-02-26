'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid, List, MessageSquare, Settings, ArrowLeft,
  Share2, UserPlus, Plus, Pencil, Trash2, Users,
  Wallet, TrendingUp, Clock, BadgeCheck, ScanLine,
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
    'text-green-400':  'bg-green-500/10',
    'text-orange-400': 'bg-orange-500/10',
    'text-red-400':    'bg-red-500/10',
    'text-blue-400':   'bg-blue-500/10',
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

  const [viewMode, setViewMode]                 = useState('table');
  const [mobileTab, setMobileTab]               = useState('contributions');
  const [scannerOpen, setScannerOpen]           = useState(false);
  const [editMemberOpen, setEditMemberOpen]     = useState(false);
  const [editMemberMode, setEditMemberMode]     = useState(false); // false=add, true=edit
  const [editTripOpen, setEditTripOpen]         = useState(false);
  const [deleteMemberOpen, setDeleteMemberOpen] = useState(false);
  const [chatOpen, setChatOpen]                 = useState(false);
  const [shareOpen, setShareOpen]               = useState(false);
  const [settingsOpen, setSettingsOpen]         = useState(false);
  const [selectedMember, setSelectedMember]     = useState(null);
  const [selectedTrip, setSelectedTrip]         = useState(null);

  const { data: groupData, isLoading, error } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const [groupResponse, membersResponse, tripsResponse] = await Promise.all([
        api.getGroupById(groupId, user?._id),
        api.getMembersByGroupId(groupId),
        api.getTripsByGroupId(groupId),
      ]);
      return {
        group:   groupResponse.data.data   || {},
        members: membersResponse.data.data || [],
        trips:   tripsResponse.data.data   || [],
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
  const group    = groupData?.group   || {};
  const members  = groupData?.members || [];
  const trips    = groupData?.trips   || [];
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
          { label: 'Total Paid',    value: info.totalPaid,   color: 'text-green-400' },
          { label: 'Total Spend',   value: info.totalSpend,  color: 'text-orange-400' },
          { label: 'Total Remain',  value: info.totalRemain, color: 'text-blue-400' },
          { label: 'Total Unpaid',  value: info.totalUnPaid, color: 'text-red-400' },
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

        {/* Page header */}
        <header className="sticky top-0 z-30 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-3 border-b border-border/30 bg-background/80 backdrop-blur-md">
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

          {/* Action row */}
          <div className="flex flex-wrap gap-2">
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
                  <Trash2 className="h-3.5 w-3.5" /> Delete Member
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Stats strip */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 border-b border-border/20">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            <StatPill icon={Users}      label="Members"     value={info.totalMember} />
            <StatPill icon={BadgeCheck} label="Total Paid"  value={info.totalPaid}   color="text-green-400" />
            <StatPill icon={TrendingUp} label="Total Spend" value={info.totalSpend}  color="text-orange-400" />
            <StatPill icon={Wallet}     label="Remain"      value={info.totalRemain} color="text-blue-400" />
            <StatPill icon={Clock}      label="Unpaid"      value={info.totalUnPaid} color="text-red-400" />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">

          {/* Mobile tab bar */}
          <div className="flex md:hidden gap-0.5 bg-muted/60 p-1 rounded-xl mb-6 w-full">
            {[
              { key: 'contributions', label: 'Contributions' },
              { key: 'trips',         label: 'Trips' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMobileTab(key)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mobileTab === key ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mobile view */}
          <div className="md:hidden">
            {mobileTab === 'contributions' && ContributionsSection}
            {mobileTab === 'trips'         && TripsSection}
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

      {/* Dialogs */}
      <EditMember        open={editMemberOpen}   onClose={() => setEditMemberOpen(false)}   groupId={groupId} member={selectedMember} members={members} editMode={editMemberMode} currency={currency} />
      <EditTrip          open={editTripOpen}     onClose={() => setEditTripOpen(false)}     groupId={groupId} trip={selectedTrip} members={members} currency={currency} />
      <DeleteMember      open={deleteMemberOpen} onClose={() => setDeleteMemberOpen(false)} groupId={groupId} member={selectedMember} members={members} trips={trips} />
      <ChatWithDatabase  open={chatOpen}         onClose={() => setChatOpen(false)}         groupId={groupId} />
      <ShareModal        open={shareOpen}        onClose={() => setShareOpen(false)}        group={group} members={members} trips={trips} currency={currency} />
      <GroupVisibilitySettings open={settingsOpen} onClose={() => setSettingsOpen(false)}  group={group} groupId={groupId} />
      <ReceiptScanner open={scannerOpen} onClose={() => setScannerOpen(false)} groupId={groupId} members={members} />
    </div>
  );
}
