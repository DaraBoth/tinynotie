'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid, List, MessageSquare, Settings, ArrowLeft,
  Share2, UserPlus, Plus, Pencil, Trash2, Users,
  Wallet, TrendingUp, ScanLine, X, ChevronDown,
  Download, FileStack, Send, ExternalLink, Pin, MoreHorizontal,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

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
import { StreamingChat } from '@/components/StreamingChat';
import { ShareModal } from '@/components/ShareModal';
import { GroupVisibilitySettings } from '@/components/GroupVisibilitySettings';
import { ReceiptScanner } from '@/components/ReceiptScanner';
import { AddUserToGroup } from '@/components/AddUserToGroup';
import { SelectTripDialog } from '@/components/SelectTripDialog';
import { MobilePullToRefresh } from '@/components/MobilePullToRefresh';
import { calculateMoney, formatTimeDifference } from '@/utils/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/* ─── avatar color helpers ────────────────────────────────────────────── */
export const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-lime-500',
];
export const getAvatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
export const getAvatarInitials = (name = '') => name.slice(0, 2).toUpperCase();

function ShareExportFlowSheet({
  open,
  onClose,
  mode = 'members',
  title,
  subtitle,
  canShareToGroup,
  canShareToPersonal,
  defaultTarget = 'group',
  onTargetChange,
  onSubmit,
  loading = false,
}) {
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState(defaultTarget);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTarget(defaultTarget);
  }, [open, defaultTarget]);

  const hasAnyTelegramTarget = canShareToGroup || canShareToPersonal;
  const effectiveTarget = canShareToGroup && !canShareToPersonal
    ? 'group'
    : (!canShareToGroup && canShareToPersonal ? 'personal' : target);

  const handleContinue = () => {
    onTargetChange?.(effectiveTarget);
    setStep(2);
  };

  const handleAction = (actionType) => {
    onSubmit?.({ mode, targetType: effectiveTarget, actionType });
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose?.(); }}>
      <SheetContent
        side="bottom"
        title={title || 'Share Data'}
        description={subtitle || 'Follow the steps to share or export your selected data.'}
        className="w-full rounded-t-3xl border-t border-border/40 p-0 h-[92vh] max-h-[92vh] sm:h-[80vh] sm:max-h-[80vh]"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/20 bg-background/80 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg font-extrabold tracking-tight">{title || 'Share Data'}</SheetTitle>
              <SheetDescription className="mt-1 text-xs">{subtitle || 'Follow the steps to share or export your selected data.'}</SheetDescription>
            </div>
            <div className="rounded-xl border border-border/30 bg-muted/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Step {step} / 2
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${step === 1 ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border/30 bg-muted/20 text-muted-foreground'}`}>
              1. Destination
            </div>
            <div className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${step === 2 ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border/30 bg-muted/20 text-muted-foreground'}`}>
              2. Action
            </div>
          </div>
        </SheetHeader>

        <div className="h-[calc(100%-166px)] overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Choose Telegram Destination</p>
              <button
                type="button"
                onClick={() => setTarget('group')}
                disabled={!canShareToGroup}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${canShareToGroup ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'} ${effectiveTarget === 'group' ? 'border-primary/60 bg-primary/10' : 'border-border/30 bg-muted/20'}`}
              >
                <p className="text-sm font-bold">Group Chat</p>
                <p className="text-xs text-muted-foreground mt-1">Send directly to the linked Telegram group conversation.</p>
              </button>
              <button
                type="button"
                onClick={() => setTarget('personal')}
                disabled={!canShareToPersonal}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${canShareToPersonal ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'} ${effectiveTarget === 'personal' ? 'border-primary/60 bg-primary/10' : 'border-border/30 bg-muted/20'}`}
              >
                <p className="text-sm font-bold">Personal Chat</p>
                <p className="text-xs text-muted-foreground mt-1">Send privately to your Telegram account.</p>
              </button>
              {!hasAnyTelegramTarget && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-300">
                  Telegram is not linked yet. You can still continue and use Export in step 2.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Choose Action</p>
              <button
                type="button"
                onClick={() => handleAction('telegram')}
                disabled={loading || !hasAnyTelegramTarget}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${loading || !hasAnyTelegramTarget ? 'opacity-50 cursor-not-allowed border-border/30 bg-muted/20' : 'border-sky-500/40 bg-sky-500/10 hover:border-sky-500/60'}`}
              >
                <p className="text-sm font-bold">Share to Telegram</p>
                <p className="text-xs text-muted-foreground mt-1">Send now to {effectiveTarget === 'group' ? 'Group Chat' : 'Personal Chat'}.</p>
              </button>
              <button
                type="button"
                onClick={() => handleAction('export')}
                disabled={loading}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${loading ? 'opacity-50 cursor-not-allowed border-border/30 bg-muted/20' : 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-500/60'}`}
              >
                <p className="text-sm font-bold">Export File</p>
                <p className="text-xs text-muted-foreground mt-1">Download as Excel for offline sharing and reporting.</p>
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-border/20 bg-background/85 backdrop-blur-sm px-5 py-3 flex gap-2">
          {step === 1 ? (
            <>
              <button type="button" onClick={onClose} disabled={loading} className="h-10 flex-1 rounded-xl border border-border/40 bg-background text-sm font-semibold">Cancel</button>
              <button type="button" onClick={handleContinue} disabled={loading} className="h-10 flex-1 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Continue</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setStep(1)} disabled={loading} className="h-10 flex-1 rounded-xl border border-border/40 bg-background text-sm font-semibold">Back</button>
              <button type="button" onClick={onClose} disabled={loading} className="h-10 flex-1 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Close</button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */
export function GroupPageClient({ groupId, initialData = null }) {
  const router = useRouter();
  const { hasHydrated, isAuthenticated, user } = useAuthGuard();
  const { isMobile } = useWindowDimensions();

  const [viewMode, setViewMode] = useState('table');
  const [mobileTab, setMobileTab] = useState('members');
  const [desktopTab, setDesktopTab] = useState('members');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [editMemberMode, setEditMemberMode] = useState(false); // false=add, true=edit
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectTripOpen, setSelectTripOpen] = useState(false);
  const [editTripOpen, setEditTripOpen] = useState(false);
  const [deleteMemberOpen, setDeleteMemberOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [shareMembersLoading, setShareMembersLoading] = useState(false);
  const [shareTripsLoading, setShareTripsLoading] = useState(false);
  const [shareTripIdLoading, setShareTripIdLoading] = useState(null);
  const [telegramTargetType, setTelegramTargetType] = useState('group');
  const [shareFlowOpen, setShareFlowOpen] = useState(false);
  const [shareFlowMode, setShareFlowMode] = useState('members');
  const [shareFlowTrip, setShareFlowTrip] = useState(null);
  const [shareFlowSubmitting, setShareFlowSubmitting] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [memberPinnedRows, setMemberPinnedRows] = useState([]);
  const [tripPinnedRows, setTripPinnedRows] = useState([]);
  const [memberPinnedColumns, setMemberPinnedColumns] = useState({ name: 'left' });
  const [tripPinnedColumns, setTripPinnedColumns] = useState({ name: 'left' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(`telegram-target-${groupId}`);
    if (saved === 'group' || saved === 'personal') {
      setTelegramTargetType(saved);
    }
  }, [groupId]);

  const handleChangeTelegramTarget = (target) => {
    setTelegramTargetType(target);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`telegram-target-${groupId}`, target);
    }
  };

  const openPanel = (action) => {
    setFabOpen(false);
    action();
  };

  const hasSSRData = !!(initialData?.group && Object.keys(initialData.group).length > 0);

  const { data: groupData, isLoading, error, refetch } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const [groupResponse, membersResponse, tripsResponse] = await Promise.all([
        api.getGroupById(groupId),
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
    initialData: hasSSRData ? initialData : undefined,
    staleTime: 30 * 1000,
    refetchInterval: 30000,
  });

  const { data: telegramStatusData, refetch: refetchTelegramStatus } = useQuery({
    queryKey: ['telegram-link-status', groupId],
    queryFn: async () => {
      const res = await api.getTelegramLinkStatus(groupId);
      return res.data;
    },
    enabled: hasHydrated && isAuthenticated && !!groupId,
    refetchInterval: 30000,
  });

  const telegramStatus = telegramStatusData?.data || null;
  const canShareToGroup = !!telegramStatus?.group_chat_linked;
  const canShareToPersonal = !!telegramStatus?.personal_chat_linked;
  const showTelegramTargetSelector = canShareToGroup && canShareToPersonal;
  const hasAnyTelegramTarget = canShareToGroup || canShareToPersonal;

  useEffect(() => {
    if (!groupId) return;

    if (canShareToGroup && !canShareToPersonal && telegramTargetType !== 'group') {
      setTelegramTargetType('group');
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`telegram-target-${groupId}`, 'group');
      }
      return;
    }

    if (!canShareToGroup && canShareToPersonal && telegramTargetType !== 'personal') {
      setTelegramTargetType('personal');
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`telegram-target-${groupId}`, 'personal');
      }
    }
  }, [groupId, canShareToGroup, canShareToPersonal, telegramTargetType]);

  const resolveTelegramTargetType = () => {
    if (showTelegramTargetSelector) return telegramTargetType;
    if (canShareToGroup) return 'group';
    if (canShareToPersonal) return 'personal';
    return telegramTargetType;
  };

  const resolveTargetType = (forcedTargetType) => {
    if (forcedTargetType === 'group' || forcedTargetType === 'personal') return forcedTargetType;
    return resolveTelegramTargetType();
  };

  const handlePullToRefresh = async () => {
    await Promise.allSettled([refetch(), refetchTelegramStatus()]);
  };

  const openShareFlow = (mode, trip = null) => {
    setShareFlowMode(mode);
    setShareFlowTrip(trip || null);
    setShareFlowOpen(true);
  };

  const handleShareTrip = async (e, trip, forcedTargetType = null) => {
    e?.stopPropagation?.(); // Don't open edit modal
    try {
      if (!hasAnyTelegramTarget) {
        toast.error('No Telegram destination is linked yet.');
        return false;
      }

      setShareTripIdLoading(trip.id);
      const res = await api.shareTripToTelegram({
        trip_id: trip.id,
        group_id: groupId,
        targetType: resolveTargetType(forcedTargetType),
      });
      if (res.data.status) {
        toast.success('Shared to Telegram!');
        return true;
      } else {
        toast.error(res.data.message || 'Failed to share to Telegram');
        return false;
      }
    } catch (err) {
      console.error('Share error:', err);
      toast.error('Error sharing to Telegram');
      return false;
    } finally {
      setShareTripIdLoading(null);
    }
  };

  const handleShareMembers = async (forcedTargetType = null) => {
    try {
      if (!hasAnyTelegramTarget) {
        toast.error('No Telegram destination is linked yet.');
        return false;
      }

      setShareMembersLoading(true);
      const allMemberIds = newData.map((row) => row._memberId).filter(Boolean);
      const memberIds = selectedMemberIds.length > 0 ? selectedMemberIds : allMemberIds;
      const res = await api.shareMembersToTelegram({
        group_id: groupId,
        targetType: resolveTargetType(forcedTargetType),
        member_ids: memberIds,
      });
      if (res.data.status) {
        toast.success('Member summary shared to Telegram!');
        return true;
      } else {
        toast.error(res.data.message || 'Failed to share to Telegram');
        return false;
      }
    } catch (err) {
      console.error('Share error:', err);
      toast.error('Error sharing member summary');
      return false;
    } finally {
      setShareMembersLoading(false);
    }
  };

  useEffect(() => {
    setViewMode(isMobile ? 'list' : 'table');
  }, [isMobile]);

  /* ── guards ── */
  if ((!hasHydrated || !isAuthenticated) && !hasSSRData) return <Loading text="Checking authentication..." />;
  if (isLoading && !groupData) return <Loading text="Loading group..." />;

  if (error) {
    return (
      <div className="min-h-screen relative">
        <MobilePullToRefresh onRefresh={handlePullToRefresh} enabled={!!isAuthenticated} />
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
  const canManageGroup = !!(group.isAdmin || group.canEdit);
  const canOpenSettings = !!group.isAdmin;

  const { info, newData } = calculateMoney(members, trips, currency);

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.update_dttm || b.create_date) - new Date(a.update_dttm || a.create_date)
  );

  const togglePinnedMemberRow = (memberId) => {
    setMemberPinnedRows((prev) => prev.includes(memberId)
      ? prev.filter((id) => id !== memberId)
      : [...prev, memberId]);
  };

  const togglePinnedTripRow = (tripId) => {
    setTripPinnedRows((prev) => prev.includes(tripId)
      ? prev.filter((id) => id !== tripId)
      : [...prev, tripId]);
  };

  const orderedMembers = [...newData].sort((a, b) => {
    const aPinned = memberPinnedRows.includes(a._memberId);
    const bPinned = memberPinnedRows.includes(b._memberId);
    if (aPinned === bPinned) return 0;
    return aPinned ? -1 : 1;
  });

  const orderedTrips = [...sortedTrips].sort((a, b) => {
    const aPinned = tripPinnedRows.includes(a.id);
    const bPinned = tripPinnedRows.includes(b.id);
    if (aPinned === bPinned) return 0;
    return aPinned ? -1 : 1;
  });

  const openEditTripFromAction = () => {
    if (sortedTrips.length === 0) {
      toast.error('No trips to edit');
      return;
    }
    // Open trip selection dialog instead of directly opening edit
    setSelectTripOpen(true);
  };

  const handleTripSelected = (trip) => {
    setSelectedTrip(trip);
    setEditTripOpen(true);
  };

  const getPayerName = (trip) => {
    if (!trip.payer_id) return '—';
    const m = members.find((m) => m.id === Number(trip.payer_id));
    return m ? m.mem_name : '—';
  };

  const getJoinedMembers = (trip) => {
    const ids = parseTripMemberIds(trip.mem_id);
    return members.filter((member) => ids.includes(Number(member.id)));
  };

  const parseTripMemberIds = (memId) => {
    try {
      if (Array.isArray(memId)) return memId.map((id) => Number(id));
      if (typeof memId === 'string') {
        const parsed = JSON.parse(memId);
        if (Array.isArray(parsed)) return parsed.map((id) => Number(id));
      }
      const num = Number(memId);
      return Number.isFinite(num) ? [num] : [];
    } catch {
      return [];
    }
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMemberIds((prev) => prev.includes(memberId)
      ? prev.filter((id) => id !== memberId)
      : [...prev, memberId]);
  };

  const toggleTripSelection = (tripId) => {
    setSelectedTripIds((prev) => prev.includes(tripId)
      ? prev.filter((id) => id !== tripId)
      : [...prev, tripId]);
  };

  const toggleAllMembers = () => {
    const allMemberIds = newData.map((row) => row._memberId).filter(Boolean);
    const allSelected = allMemberIds.length > 0 && allMemberIds.every((id) => selectedMemberIds.includes(id));
    setSelectedMemberIds(allSelected ? [] : allMemberIds);
  };

  const toggleAllTrips = () => {
    const allTripIds = sortedTrips.map((trip) => trip.id).filter(Boolean);
    const allSelected = allTripIds.length > 0 && allTripIds.every((id) => selectedTripIds.includes(id));
    setSelectedTripIds(allSelected ? [] : allTripIds);
  };

  const handleExportMembers = () => {
    const selectedRows = selectedMemberIds.length > 0
      ? newData.filter((row) => selectedMemberIds.includes(row._memberId))
      : newData;

    const data = selectedRows.map((row, idx) => {
      const item = {
        '#': idx + 1,
        'Member Name': row.name || '—',
        'Paid': row.paid || '0.00',
        'Remain': row.remain || '0.00',
        'Unpaid': row.unpaid || '0.00'
      };
      tripColumns.forEach((tripName) => {
        item[tripName] = row[tripName] ?? '—';
      });
      return item;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      ...tripColumns.map(() => ({ wch: 14 })),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `${group.grp_name || 'Group'}_Members.xlsx`);
    toast.success(`Members export downloaded (${selectedRows.length} row${selectedRows.length === 1 ? '' : 's'})`);
  };

  const handleExportTrips = () => {
    const selectedTrips = selectedTripIds.length > 0
      ? sortedTrips.filter((trip) => selectedTripIds.includes(trip.id))
      : sortedTrips;

    const data = selectedTrips.map((trip, idx) => {
      const ids = parseTripMemberIds(trip.mem_id);
      const joinedBy = members
        .filter((member) => ids.includes(Number(member.id)))
        .map((member) => member.mem_name)
        .join(', ') || '—';

      return {
        '#': idx + 1,
        'Trip Name': trip.trp_name || '—',
        'Amount': `${currency}${parseFloat(trip.spend || 0).toFixed(2)}`,
        'Payer': getPayerName(trip),
        'Joined By': joinedBy,
        'Updated': formatTimeDifference(trip.update_dttm || trip.create_date),
        'Description': trip.description || '—',
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 14 },
      { wch: 18 },
      { wch: 34 },
      { wch: 16 },
      { wch: 36 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trips');
    XLSX.writeFile(wb, `${group.grp_name || 'Group'}_Trips.xlsx`);
    toast.success(`Trips export downloaded (${selectedTrips.length} row${selectedTrips.length === 1 ? '' : 's'})`);
  };

  const handleShareSelectedTrips = async (forcedTargetType = null) => {
    try {
      if (!hasAnyTelegramTarget) {
        toast.error('No Telegram destination is linked yet.');
        return false;
      }

      setShareTripsLoading(true);
      const tripIds = selectedTripIds.length > 0 ? selectedTripIds : sortedTrips.map((trip) => trip.id).filter(Boolean);
      const res = await api.shareTripToTelegram({
        group_id: groupId,
        trip_ids: tripIds,
        targetType: resolveTargetType(forcedTargetType),
      });

      if (res.data.status) {
        toast.success('Trip data shared to Telegram!');
        return true;
      } else {
        toast.error(res.data.message || 'Failed to share trip data');
        return false;
      }
    } catch (err) {
      console.error('Bulk trip share error:', err);
      toast.error('Error sharing trips to Telegram');
      return false;
    } finally {
      setShareTripsLoading(false);
    }
  };

  const handleShareFlowAction = async ({ actionType, targetType }) => {
    setShareFlowSubmitting(true);
    let success = false;

    try {
      if (actionType === 'export') {
        if (shareFlowMode === 'members') {
          handleExportMembers();
          success = true;
        } else if (shareFlowMode === 'trips') {
          handleExportTrips();
          success = true;
        } else if (shareFlowMode === 'trip-single' && shareFlowTrip?.id) {
          setSelectedTripIds([shareFlowTrip.id]);
          const selectedTrips = [shareFlowTrip];
          const data = selectedTrips.map((trip, idx) => {
            const ids = parseTripMemberIds(trip.mem_id);
            const joinedBy = members
              .filter((member) => ids.includes(Number(member.id)))
              .map((member) => member.mem_name)
              .join(', ') || '—';

            return {
              '#': idx + 1,
              'Trip Name': trip.trp_name || '—',
              'Amount': `${currency}${parseFloat(trip.spend || 0).toFixed(2)}`,
              'Payer': getPayerName(trip),
              'Joined By': joinedBy,
              'Updated': formatTimeDifference(trip.update_dttm || trip.create_date),
              'Description': trip.description || '—',
            };
          });
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 6 },
            { wch: 24 },
            { wch: 14 },
            { wch: 18 },
            { wch: 34 },
            { wch: 16 },
            { wch: 36 },
          ];
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Trip');
          XLSX.writeFile(wb, `${group.grp_name || 'Group'}_${shareFlowTrip.trp_name || 'Trip'}.xlsx`);
          toast.success('Trip export downloaded (1 row)');
          success = true;
        }
      }

      if (actionType === 'telegram') {
        if (shareFlowMode === 'members') {
          success = await handleShareMembers(targetType);
        } else if (shareFlowMode === 'trips') {
          success = await handleShareSelectedTrips(targetType);
        } else if (shareFlowMode === 'trip-single' && shareFlowTrip) {
          success = await handleShareTrip(null, shareFlowTrip, targetType);
        }
      }

      if (success) {
        setShareFlowOpen(false);
      }
    } finally {
      setShareFlowSubmitting(false);
    }
  };

  const getMemberCount = (trip) => {
    const ids = parseTripMemberIds(trip.mem_id);
    return ids.length || 1;
  };

  const tripColumns = trips.map((t) => t.trp_name);

  const memberTableColumns = [
    { key: 'sel', label: 'Sel', width: 64, align: 'left' },
    { key: 'index', label: '#', width: 56, align: 'left' },
    { key: 'name', label: 'Name', width: 160, align: 'left' },
    { key: 'paid', label: 'Paid', width: 120, align: 'right' },
    ...tripColumns.map((name) => ({ key: `trip:${name}`, label: name, width: 140, align: 'right' })),
    { key: 'remain', label: 'Remain', width: 120, align: 'right' },
    { key: 'unpaid', label: 'Unpaid', width: 120, align: 'right' },
  ];

  const tripTableColumns = [
    { key: 'sel', label: 'Sel', width: 64, align: 'left' },
    { key: 'name', label: 'Name', width: 190, align: 'left' },
    { key: 'amount', label: 'Amount', width: 120, align: 'right' },
    { key: 'payer', label: 'Payer', width: 130, align: 'right', hideOnSmall: true },
    { key: 'joined', label: 'Joined By', width: 180, align: 'left', hideOnSmall: true },
    { key: 'updated', label: 'Updated', width: 150, align: 'right' },
  ];

  const cyclePinSide = (current) => {
    if (current === 'left') return 'right';
    if (current === 'right') return null;
    return 'left';
  };

  const togglePinColumn = (table, key) => {
    if (table === 'members') {
      setMemberPinnedColumns((prev) => {
        const next = cyclePinSide(prev[key]);
        const updated = { ...prev };
        if (!next) delete updated[key];
        else updated[key] = next;
        return updated;
      });
      return;
    }

    setTripPinnedColumns((prev) => {
      const next = cyclePinSide(prev[key]);
      const updated = { ...prev };
      if (!next) delete updated[key];
      else updated[key] = next;
      return updated;
    });
  };

  const getPinnedMeta = (columns, pinnedMap) => {
    const leftColumns = columns.filter((col) => pinnedMap[col.key] === 'left');
    const rightColumns = columns.filter((col) => pinnedMap[col.key] === 'right');

    const leftOffsets = {};
    let leftSum = 0;
    leftColumns.forEach((col) => {
      leftOffsets[col.key] = leftSum;
      leftSum += col.width;
    });

    const rightOffsets = {};
    let rightSum = 0;
    [...rightColumns].reverse().forEach((col) => {
      rightOffsets[col.key] = rightSum;
      rightSum += col.width;
    });

    return { leftOffsets, rightOffsets };
  };

  const getPinnedCellStyle = (column, pinnedMap, pinnedMeta, isHeader = false) => {
    const side = pinnedMap[column.key];
    const baseStyle = {
      minWidth: `${column.width}px`,
      width: `${column.width}px`,
      maxWidth: `${column.width}px`,
    };

    if (!side) return baseStyle;

    const stickyStyle = {
      ...baseStyle,
      position: 'sticky',
      zIndex: isHeader ? 35 : 20,
      background: 'hsl(var(--background) / 0.96)',
      backdropFilter: 'blur(2px)',
      ...(isHeader ? { top: '0px' } : {}),
    };

    if (side === 'left') {
      return {
        ...stickyStyle,
        left: `${pinnedMeta.leftOffsets[column.key] || 0}px`,
        boxShadow: '1px 0 0 rgba(255,255,255,0.08)',
      };
    }

    return {
      ...stickyStyle,
      right: `${pinnedMeta.rightOffsets[column.key] || 0}px`,
      boxShadow: '-1px 0 0 rgba(255,255,255,0.08)',
    };
  };

  const memberPinnedMeta = getPinnedMeta(memberTableColumns, memberPinnedColumns);
  const tripPinnedMeta = getPinnedMeta(tripTableColumns, tripPinnedColumns);

  const renderTelegramTargetControl = () => {
    if (showTelegramTargetSelector) {
      return (
        <div className="flex gap-1 bg-muted/60 p-1 rounded-lg">
          <button
            onClick={() => handleChangeTelegramTarget('group')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${telegramTargetType === 'group' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Group
          </button>
          <button
            onClick={() => handleChangeTelegramTarget('personal')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${telegramTargetType === 'personal' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Personal
          </button>
        </div>
      );
    }

    if (canShareToGroup) {
      return (
        <div className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-muted/50 text-muted-foreground">
          Group
        </div>
      );
    }

    if (canShareToPersonal) {
      return (
        <div className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-muted/50 text-muted-foreground">
          Personal (auto)
        </div>
      );
    }

    return null;
  };

  /* ─── main component ─────────────────────────────────────────────────────── */

  const ContributionsSection = (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 px-1 border-b border-border/10 pb-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Users className="h-3.5 w-3.5" /> Contributions
        </h2>
          <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] gap-1.5 text-muted-foreground hover:text-foreground uppercase tracking-widest font-bold"
            onClick={toggleAllMembers}
          >
            {selectedMemberIds.length > 0 ? 'Clear' : 'Select All'}
          </Button>
          {renderTelegramTargetControl()}
          <Button
            size="sm" variant="ghost" className="h-7 text-[10px] gap-1.5 text-muted-foreground hover:text-foreground uppercase tracking-widest font-bold"
            onClick={() => openShareFlow('members')}
            disabled={shareFlowSubmitting || shareMembersLoading}
          >
            {(shareFlowSubmitting || shareMembersLoading) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
            Share {selectedMemberIds.length > 0 ? `(${selectedMemberIds.length})` : ''}
          </Button>
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
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/40 rounded-2xl">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No members yet</p>
          {canManageGroup && (
            <Button size="sm" variant="outline" className="mt-4"
              onClick={() => { setSelectedMember(null); setEditMemberOpen(true); }}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Add First Member
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-auto scrollbar-hide max-h-[68vh] rounded-xl border border-border/30 bg-background/20 backdrop-blur-sm">
          <table className="w-full text-sm min-w-[980px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border/50 bg-muted/30">
                {memberTableColumns.map((column) => (
                  <th
                    key={column.key}
                    style={getPinnedCellStyle(column, memberPinnedColumns, memberPinnedMeta, true)}
                    className={`${column.align === 'right' ? 'text-right' : 'text-left'} px-3 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide`}
                  >
                    <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                      <span className="truncate" title={column.label}>{column.label}</span>
                      {column.key !== 'sel' && (
                        <button
                          type="button"
                          onClick={() => togglePinColumn('members', column.key)}
                          className="inline-flex items-center justify-center rounded p-0.5 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                          title={`Pin ${column.label} (left/right)`}
                        >
                          <Pin className={`h-3 w-3 ${memberPinnedColumns[column.key] ? 'text-primary' : ''}`} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {newData.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                  {memberTableColumns.map((column) => {
                    const baseClass = `${column.align === 'right' ? 'text-right' : 'text-left'} px-3 py-3`;

                    if (column.key === 'sel') {
                      return (
                        <td key={`${row.id || idx}-${column.key}`} style={getPinnedCellStyle(column, memberPinnedColumns, memberPinnedMeta)} className={baseClass}>
                          <input
                            type="checkbox"
                            checked={selectedMemberIds.includes(row._memberId)}
                            onChange={() => toggleMemberSelection(row._memberId)}
                            className="h-4 w-4 accent-primary"
                          />
                        </td>
                      );
                    }

                    if (column.key === 'index') {
                      return <td key={`${row.id || idx}-${column.key}`} style={getPinnedCellStyle(column, memberPinnedColumns, memberPinnedMeta)} className={`${baseClass} text-muted-foreground text-xs`}>{idx + 1}</td>;
                    }

                    if (column.key === 'name') {
                      return <td key={`${row.id || idx}-${column.key}`} style={getPinnedCellStyle(column, memberPinnedColumns, memberPinnedMeta)} className={`${baseClass} font-semibold truncate`}>{row.name}</td>;
                    }

                    if (column.key === 'paid') {
                      return <td key={`${row.id || idx}-${column.key}`} style={getPinnedCellStyle(column, memberPinnedColumns, memberPinnedMeta)} className={`${baseClass} text-emerald-600 dark:text-emerald-400 font-medium`}>{row.paid}</td>;
                    }

                    if (column.key === 'remain') {
                      return (
                        <td
                          key={`${row.id || idx}-${column.key}`}
                          style={getPinnedCellStyle(column, memberPinnedColumns, memberPinnedMeta)}
                          className={`${baseClass} font-semibold ${String(row.remain).startsWith('-') ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                        >
                          {row.remain}
                        </td>
                      );
                    }

                    if (column.key === 'unpaid') {
                      return <td key={`${row.id || idx}-${column.key}`} style={getPinnedCellStyle(column, memberPinnedColumns, memberPinnedMeta)} className={`${baseClass} text-rose-600 dark:text-rose-400`}>{row.unpaid}</td>;
                    }

                    if (column.key.startsWith('trip:')) {
                      const tripName = column.key.replace('trip:', '');
                      return (
                        <td key={`${row.id || idx}-${column.key}`} style={getPinnedCellStyle(column, memberPinnedColumns, memberPinnedMeta)} className={`${baseClass} text-orange-600 dark:text-orange-400 text-sm truncate`}>
                          {row[tripName] ?? '—'}
                        </td>
                      );
                    }

                    return <td key={`${row.id || idx}-${column.key}`} style={getPinnedCellStyle(column, memberPinnedColumns, memberPinnedMeta)} className={baseClass}>—</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {orderedMembers.map((row, idx) => {
            const member = members.find((m) => Number(m.id) === Number(row._memberId)) || members[idx];
            const isPinned = memberPinnedRows.includes(row._memberId);
            return (
            <div key={row._memberId || row.id || idx} className={`border rounded-xl p-4 backdrop-blur-sm hover:bg-muted/20 transition-colors ${isPinned ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-background/20'}`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(row._memberId)}
                    onChange={() => toggleMemberSelection(row._memberId)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="font-semibold">{row.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => togglePinnedMemberRow(row._memberId)}
                    title="Pin member"
                  >
                    <Pin className={`h-3.5 w-3.5 ${isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
                  </Button>
                  <Badge variant="outline" className="text-xs font-normal">#{idx + 1}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wide block mb-0.5">Paid</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{row.paid}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wide block mb-0.5">Remain</span>
                  <span className={`font-semibold ${String(row.remain).startsWith('-') ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{row.remain}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wide block mb-0.5">Unpaid</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">{row.unpaid}</span>
                </div>
              </div>
              {tripColumns.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-1.5">
                  {tripColumns.map((name) => (
                    <span key={name} className="text-xs bg-muted/60 rounded-lg px-2 py-1">
                      <span className="text-muted-foreground">{name}:</span>{' '}
                      <span className="text-orange-600 dark:text-orange-400 font-medium">{row[name] ?? '—'}</span>
                    </span>
                  ))}
                </div>
              )}
              {member && canManageGroup && (
                <div className="mt-3 pt-3 border-t border-border/20">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setSelectedMember(member);
                      setEditMemberMode(true);
                      setEditMemberOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                </div>
              )}
            </div>
          )})}
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
        {isMobile ? (
          <div className="flex flex-col gap-1.5 w-full max-w-[260px]">
            <div className="grid grid-cols-2 gap-1.5">
            <Button size="sm" variant="outline" className="h-8 text-xs"
              onClick={toggleAllTrips}>
              {selectedTripIds.length > 0 ? 'Clear' : 'Select'}
            </Button>
            {canManageGroup && (
              <Button size="sm" variant="outline" className="h-8 text-xs"
                onClick={() => { setSelectedTrip(null); setEditTripOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs"
              onClick={() => openShareFlow('trips')}
              disabled={shareFlowSubmitting || shareTripsLoading}>
              {(shareFlowSubmitting || shareTripsLoading) ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Share2 className="h-3.5 w-3.5 mr-1" />} Share
            </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button
              size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={toggleAllTrips}
            >
              {selectedTripIds.length > 0 ? 'Clear' : 'Select All'}
            </Button>
            <div className="mr-1">{renderTelegramTargetControl()}</div>
            <Button
              size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => openShareFlow('trips')}
              disabled={shareFlowSubmitting || shareTripsLoading}
            >
              {(shareFlowSubmitting || shareTripsLoading) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />} Share {selectedTripIds.length > 0 ? `(${selectedTripIds.length})` : ''}
            </Button>
            <div className="hidden md:flex gap-0.5 bg-muted/60 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="h-3 w-3" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-3 w-3" />
                <span>List</span>
              </button>
            </div>
            {canManageGroup && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => { setSelectedTrip(null); setEditTripOpen(true); }}>
                <Plus className="h-3.5 w-3.5" /> Add Trip
              </Button>
            )}
          </div>
        )}
      </div>
      {sortedTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/40 rounded-2xl">
          <TrendingUp className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No trips yet</p>
          {canManageGroup && (
            <Button size="sm" variant="outline" className="mt-4"
              onClick={() => { setSelectedTrip(null); setEditTripOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Add First Trip
            </Button>
          )}
        </div>
      ) : isMobile ? (
        <div className="space-y-2">
          {sortedTrips.map((trip, idx) => {
            const joinedMembers = getJoinedMembers(trip);
            return (
              <div key={trip.id || idx} className="rounded-2xl border border-border/30 bg-background/30 p-4 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedTripIds.includes(trip.id)}
                      onChange={() => toggleTripSelection(trip.id)}
                      className="h-4 w-4 accent-primary mt-1"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight break-words">{trip.trp_name || 'Untitled Trip'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimeDifference(trip.update_dttm || trip.create_date)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="rounded-lg border border-border/20 bg-muted/20 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{currency}{parseFloat(trip.spend || 0).toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg border border-border/20 bg-muted/20 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payer</p>
                    <p className="text-sm font-semibold truncate">{getPayerName(trip)}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Joined By ({getMemberCount(trip)})</p>
                  {joinedMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {joinedMembers.map((member) => (
                        <span key={member.id} className="text-xs rounded-md bg-muted/50 px-2 py-1 max-w-full break-all">{member.mem_name}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No participants</p>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border/20 flex gap-2">
                  {canManageGroup && (
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setSelectedTrip(trip); setEditTripOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openShareFlow('trip-single', trip)} disabled={shareTripIdLoading === trip.id || shareFlowSubmitting}>
                    
                    {shareTripIdLoading === trip.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                    {shareTripIdLoading === trip.id ? 'Sending...' : 'Telegram'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-xl border border-border/30 bg-background/20 backdrop-blur-sm overflow-auto scrollbar-hide max-h-[68vh]">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border/50 bg-muted/30">
                {tripTableColumns.map((column) => (
                  <th
                    key={column.key}
                    style={getPinnedCellStyle(column, tripPinnedColumns, tripPinnedMeta, true)}
                    className={`${column.align === 'right' ? 'text-right' : 'text-left'} px-3 py-2 text-muted-foreground font-medium text-[11px] uppercase tracking-wide ${column.hideOnSmall ? 'hidden sm:table-cell' : ''}`}
                  >
                    <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                      <span className="truncate" title={column.label}>{column.label}</span>
                      {column.key !== 'sel' && (
                        <button
                          type="button"
                          onClick={() => togglePinColumn('trips', column.key)}
                          className="inline-flex items-center justify-center rounded p-0.5 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                          title={`Pin ${column.label} (left/right)`}
                        >
                          <Pin className={`h-3 w-3 ${tripPinnedColumns[column.key] ? 'text-primary' : ''}`} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderedTrips.map((trip, idx) => (
                <tr key={trip.id || idx}
                  className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => {
                    if (!canManageGroup) return;
                    setSelectedTrip(trip);
                    setEditTripOpen(true);
                  }}>
                  {tripTableColumns.map((column) => {
                    const baseClass = `${column.align === 'right' ? 'text-right' : 'text-left'} px-3 py-2.5 ${column.hideOnSmall ? 'hidden sm:table-cell' : ''}`;

                    if (column.key === 'sel') {
                      return (
                        <td key={`${trip.id || idx}-${column.key}`} style={getPinnedCellStyle(column, tripPinnedColumns, tripPinnedMeta)} className={baseClass} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTripIds.includes(trip.id)}
                            onChange={() => toggleTripSelection(trip.id)}
                            className="h-4 w-4 accent-primary"
                          />
                        </td>
                      );
                    }

                    if (column.key === 'name') {
                      return <td key={`${trip.id || idx}-${column.key}`} style={getPinnedCellStyle(column, tripPinnedColumns, tripPinnedMeta)} className={`${baseClass} font-medium truncate`} title={trip.trp_name}>{trip.trp_name}</td>;
                    }

                    if (column.key === 'amount') {
                      return <td key={`${trip.id || idx}-${column.key}`} style={getPinnedCellStyle(column, tripPinnedColumns, tripPinnedMeta)} className={`${baseClass} text-emerald-600 dark:text-emerald-400 font-semibold`}>{currency}{parseFloat(trip.spend || 0).toFixed(2)}</td>;
                    }

                    if (column.key === 'payer') {
                      return <td key={`${trip.id || idx}-${column.key}`} style={getPinnedCellStyle(column, tripPinnedColumns, tripPinnedMeta)} className={`${baseClass} text-muted-foreground truncate`}>{getPayerName(trip)}</td>;
                    }

                    if (column.key === 'joined') {
                      return (
                        <td key={`${trip.id || idx}-${column.key}`} style={getPinnedCellStyle(column, tripPinnedColumns, tripPinnedMeta)} className={baseClass}>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {(() => {
                              const joined = getJoinedMembers(trip);
                              return joined.slice(0, 3).map((member) => (
                                <Avatar key={member.id} className="h-5 w-5 border border-background ring-1 ring-border/20">
                                  <AvatarFallback className={`${getAvatarColor(member.mem_name)} text-[8px] text-white font-bold`}>
                                    {getAvatarInitials(member.mem_name)}
                                  </AvatarFallback>
                                </Avatar>
                              )).concat(joined.length > 3 ? (
                                <div key="more" className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-bold text-muted-foreground">
                                  +{joined.length - 3}
                                </div>
                              ) : []);
                            })()}
                          </div>
                        </td>
                      );
                    }

                    if (column.key === 'updated') {
                      return (
                        <td key={`${trip.id || idx}-${column.key}`} style={getPinnedCellStyle(column, tripPinnedColumns, tripPinnedMeta)} className={`${baseClass} text-muted-foreground text-xs`}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 hover:bg-sky-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                openShareFlow('trip-single', trip);
                              }}
                              disabled={shareTripIdLoading === trip.id}
                              title="Share options"
                            >
                              {shareTripIdLoading === trip.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            </Button>
                            <span>{formatTimeDifference(trip.update_dttm || trip.create_date)}</span>
                          </div>
                        </td>
                      );
                    }

                    return <td key={`${trip.id || idx}-${column.key}`} style={getPinnedCellStyle(column, tripPinnedColumns, tripPinnedMeta)} className={baseClass}>—</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {orderedTrips.map((trip, idx) => {
            const isPinned = tripPinnedRows.includes(trip.id);
            const joinedMembers = getJoinedMembers(trip);
            return (
              <div key={trip.id || idx} className={`rounded-xl border p-4 transition-colors ${isPinned ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-background/20'}`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedTripIds.includes(trip.id)}
                      onChange={() => toggleTripSelection(trip.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <p className="font-semibold truncate" title={trip.trp_name}>{trip.trp_name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => togglePinnedTripRow(trip.id)} title="Pin trip">
                      <Pin className={`h-3.5 w-3.5 ${isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                    <Badge variant="outline" className="text-xs">{formatTimeDifference(trip.update_dttm || trip.create_date)}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Amount</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{currency}{parseFloat(trip.spend || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Payer</p>
                    <p className="truncate">{getPayerName(trip)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Members</p>
                    <p>{getMemberCount(trip)}</p>
                  </div>
                </div>
                {joinedMembers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/20 flex flex-wrap gap-1.5">
                    {joinedMembers.map((member) => (
                      <span key={member.id} className="text-xs bg-muted/60 rounded-lg px-2 py-1">{member.mem_name}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
          { label: 'Total Paid', value: info.totalPaid, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total Spend', value: info.totalSpend, color: 'text-orange-600 dark:text-orange-400' },
          { label: 'Total Remain', value: info.totalRemain, color: 'text-sky-600 dark:text-sky-400' },
          { label: 'Total Unpaid', value: info.totalUnPaid, color: 'text-rose-600 dark:text-rose-400' },
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
        <div className="sticky top-14 sm:top-16 z-30 w-full border-b border-border/30">
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
                {canOpenSettings && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSettingsOpen(true)} title="Settings">
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="More">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-xl">
                    <DropdownMenuItem onClick={() => setShareOpen(true)} className="cursor-pointer">
                      <Share2 className="mr-2 h-4 w-4" /> Share Group
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setChatOpen(true)} className="cursor-pointer">
                      <MessageSquare className="mr-2 h-4 w-4" /> AI Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Action row — hidden on mobile (FAB handles those) */}
            {canManageGroup && <div className="hidden md:flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs"
                onClick={() => { setEditMemberMode(false); setSelectedMember(null); setEditMemberOpen(true); }}>
                <UserPlus className="h-3.5 w-3.5" /> Add Member
              </Button>
              <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs"
                onClick={() => { setSelectedTrip(null); setEditTripOpen(true); }}>
                <Plus className="h-3.5 w-3.5" /> Add Trip
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                    <MoreHorizontal className="h-3.5 w-3.5" /> More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 rounded-xl">
                  <DropdownMenuItem onClick={() => setAddUserOpen(true)} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" /> Add User
                  </DropdownMenuItem>
                  {sortedTrips.length > 0 && (
                    <DropdownMenuItem onClick={openEditTripFromAction} className="cursor-pointer">
                      <FileStack className="mr-2 h-4 w-4" /> Edit Trip
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setScannerOpen(true)} className="cursor-pointer">
                    <ScanLine className="mr-2 h-4 w-4" /> Scan Receipt
                  </DropdownMenuItem>
                  {members.length > 0 && (
                    <>
                      <DropdownMenuItem onClick={() => { setEditMemberMode(true); setSelectedMember(null); setEditMemberOpen(true); }} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" /> Edit Member
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setSelectedMember(null); setDeleteMemberOpen(true); }} className="cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>}
          </header>

        </div>

        {/* Content starts below sticky section */}

        {/* Mobile Hero Balance Card */}
        <div className="md:hidden px-4 pt-4 pb-2">
          <div className="relative overflow-hidden rounded-2xl p-5 shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--hero-start, #312e81) 0%, var(--hero-mid, #4c1d95) 50%, var(--hero-end, #1e1b4b) 100%)' }}>
            {/* Decorative blur orbs */}
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-violet-400/20 blur-xl" />
            <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold mb-1">Total Spend</p>
            <p className="text-white text-4xl font-extrabold tracking-tight mb-4 drop-shadow-sm">{info.totalSpend}</p>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl bg-white/10 dark:bg-white/15 backdrop-blur-md px-3 py-2 text-center border border-white/10">
                <p className="text-[9px] uppercase tracking-widest text-white/70 mb-0.5 font-bold">Paid</p>
                <p className="text-emerald-300 font-black text-sm">{info.totalPaid}</p>
              </div>
              <div className="flex-1 rounded-xl bg-white/10 dark:bg-white/15 backdrop-blur-md px-3 py-2 text-center border border-white/10">
                <p className="text-[9px] uppercase tracking-widest text-white/70 mb-0.5 font-bold">Remain</p>
                <p className="text-sky-300 font-black text-sm">{info.totalRemain}</p>
              </div>
              <div className="flex-1 rounded-xl bg-white/10 dark:bg-white/15 backdrop-blur-md px-3 py-2 text-center border border-white/10">
                <p className="text-[9px] uppercase tracking-widest text-white/70 mb-0.5 font-bold">Unpaid</p>
                <p className="text-rose-300 font-black text-sm">{info.totalUnPaid}</p>
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
                <div className="flex items-center gap-2 mb-3">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={toggleAllMembers}>
                    {selectedMemberIds.length > 0 ? 'Clear' : 'Select All'}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openShareFlow('members')} disabled={shareFlowSubmitting || shareMembersLoading}>
                    {(shareFlowSubmitting || shareMembersLoading) ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Share2 className="h-3.5 w-3.5 mr-1" />}
                    Share {selectedMemberIds.length > 0 ? `(${selectedMemberIds.length})` : ''}
                  </Button>
                </div>
                {members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/40 rounded-2xl">
                    <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">No members yet</p>
                    {canManageGroup && (
                      <Button size="sm" variant="outline" className="mt-4"
                        onClick={() => { setSelectedMember(null); setEditMemberOpen(true); }}>
                        <UserPlus className="h-4 w-4 mr-1.5" /> Add First Member
                      </Button>
                    )}
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
                            <input
                              type="checkbox"
                              checked={selectedMemberIds.includes(row._memberId)}
                              onChange={() => toggleMemberSelection(row._memberId)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 accent-primary shrink-0"
                            />
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm ${getAvatarColor(row.name)}`}>
                              {getAvatarInitials(row.name)}
                            </div>
                            {/* Name + status */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{row.name}</p>
                              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${isPaid
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                }`}>
                                {isPaid ? 'PAID' : 'UNPAID'}
                              </span>
                            </div>
                            {/* Amount + chevron */}
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <div>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{row.paid}</p>
                                {!isPaid && <p className="text-xs text-rose-600 dark:text-rose-400">{row.unpaid} due</p>}
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
                                      <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{t.amount}</span>
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
                                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                                  <p className="text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400/70 mb-0.5">Paid</p>
                                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{row.paid}</p>
                                </div>
                                <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 px-3 py-2">
                                  <p className="text-[9px] uppercase tracking-widest text-sky-600 dark:text-sky-400/70 mb-0.5">Remain</p>
                                  <p className="text-sm font-bold text-sky-600 dark:text-sky-400">{row.remain}</p>
                                </div>
                              </div>

                              {/* Edit button */}
                              {canManageGroup && (
                                <button
                                  onClick={() => { setSelectedMember(member); setEditMemberMode(true); setEditMemberOpen(true); }}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/30 bg-muted/30 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-95"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Edit Member
                                </button>
                              )}
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
                    { label: 'Total Paid', value: info.totalPaid, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Total Spend', value: info.totalSpend, color: 'text-orange-600 dark:text-orange-400' },
                    { label: 'Total Remain', value: info.totalRemain, color: 'text-sky-600 dark:text-sky-400' },
                    { label: 'Total Unpaid', value: info.totalUnPaid, color: 'text-rose-600 dark:text-rose-400' },
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

          {/* Desktop tabbed view */}
          <div className="hidden md:block">
            <div className="mb-4 border-b border-border/20">
              <div className="flex gap-1">
                {[
                  { key: 'members', label: 'Members', icon: Users },
                  { key: 'trips', label: 'Trips', icon: TrendingUp },
                  { key: 'summary', label: 'Summary', icon: Wallet },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setDesktopTab(key)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${desktopTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {desktopTab === 'members' && ContributionsSection}
            {desktopTab === 'trips' && TripsSection}
            {desktopTab === 'summary' && SummarySection}
          </div>
        </div>
      </div>

      {/* ── Mobile FAB + Bottom Action Sheet (mobile only) ───────────────── */}

      {/* Backdrop / scrim */}
      {canManageGroup && fabOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Bottom Action Sheet */}
      {canManageGroup && <div
        className={`md:hidden fixed inset-x-0 w-screen max-w-none z-50 transition-all duration-300 ease-out ${fabOpen ? 'bottom-0' : '-bottom-full'
          }`}
      >
        <div className="bg-background/75 backdrop-blur-xl rounded-t-3xl border-t border-border/30 shadow-2xl pb-safe">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          {/* Sheet title */}
          <p className="text-center text-xs font-semibold uppercase tracking-widest px-6 pb-4 pt-2">
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

            {/* Add User */}
            <button
              onClick={() => openPanel(() => setAddUserOpen(true))}
              className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-center leading-tight">Add User</span>
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

            {/* Edit Trip */}
            {sortedTrips.length > 0 && (
              <button
                onClick={() => openPanel(() => openEditTripFromAction())}
                className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                  <FileStack className="h-6 w-6 text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-center leading-tight">Edit Trip</span>
              </button>
            )}

            {/* Scan Receipt */}
            <button
              onClick={() => openPanel(() => setScannerOpen(true))}
              className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                <ScanLine className="h-6 w-6 text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-center leading-tight">Scan Receipt</span>
            </button>

            {/* Share Members */}
            {members.length > 0 && (
              <button
                onClick={() => openPanel(() => openShareFlow('members'))}
                className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500/15 flex items-center justify-center">
                  <Send className="h-6 w-6 text-sky-400" />
                </div>
                <span className="text-xs font-semibold text-center leading-tight">Share Members</span>
              </button>
            )}

            {/* Share Trips */}
            {sortedTrips.length > 0 && (
              <button
                onClick={() => openPanel(() => openShareFlow('trips'))}
                className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl active:bg-muted/60 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-cyan-400" />
                </div>
                <span className="text-xs font-semibold text-center leading-tight">Share Trips</span>
              </button>
            )}

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
      </div>}

      {/* FAB button */}
      {canManageGroup && <button
        onClick={() => setFabOpen((o) => !o)}
        className={`md:hidden fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 ${fabOpen
          ? 'bg-foreground text-background rotate-45'
          : 'bg-primary text-primary-foreground'
          }`}
      >
        <Plus className="h-6 w-6" />
      </button>}

      {/* Panels & Dialogs */}
      {canManageGroup && <EditMember open={editMemberOpen} onClose={() => setEditMemberOpen(false)} groupId={groupId} member={selectedMember} members={members} editMode={editMemberMode} currency={currency} />}
      {canManageGroup && <AddUserToGroup open={addUserOpen} onClose={() => setAddUserOpen(false)} groupId={groupId} existingMembers={members} isAdmin={!!group.isAdmin} />}
      <SelectTripDialog open={selectTripOpen} onClose={() => setSelectTripOpen(false)} trips={sortedTrips} onSelectTrip={handleTripSelected} currency={currency} />
      {canManageGroup && <EditTrip open={editTripOpen} onClose={() => setEditTripOpen(false)} groupId={groupId} trip={selectedTrip} members={members} currency={currency} />}
      {canManageGroup && <DeleteMember open={deleteMemberOpen} onClose={() => setDeleteMemberOpen(false)} groupId={groupId} member={selectedMember} members={members} trips={trips} />}
      <StreamingChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        groupId={groupId}
        onDataChanged={() => {
          refetch();
          toast.success('Group data refreshed.');
        }}
      />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} group={group} members={members} trips={trips} currency={currency} />
      <ShareExportFlowSheet
        open={shareFlowOpen}
        onClose={() => setShareFlowOpen(false)}
        mode={shareFlowMode}
        title={
          shareFlowMode === 'members'
            ? 'Share Members'
            : shareFlowMode === 'trips'
              ? 'Share Trips'
              : `Share ${shareFlowTrip?.trp_name || 'Trip'}`
        }
        subtitle="Step 1: pick destination. Step 2: choose Telegram or Export."
        canShareToGroup={canShareToGroup}
        canShareToPersonal={canShareToPersonal}
        defaultTarget={resolveTelegramTargetType()}
        onTargetChange={handleChangeTelegramTarget}
        onSubmit={handleShareFlowAction}
        loading={shareFlowSubmitting || shareMembersLoading || shareTripsLoading || Boolean(shareTripIdLoading)}
      />
      {canOpenSettings && <GroupVisibilitySettings open={settingsOpen} onClose={() => setSettingsOpen(false)} group={group} groupId={groupId} isAdmin={!!group.isAdmin} />}
      {canManageGroup && <ReceiptScanner open={scannerOpen} onClose={() => setScannerOpen(false)} groupId={groupId} members={members} />}
    </div>
  );
}
