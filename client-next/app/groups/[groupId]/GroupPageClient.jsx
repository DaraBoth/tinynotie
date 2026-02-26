'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid,
  List,
  MessageSquare,
  Settings,
  ArrowLeft,
  Share2,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { calculateMoney, formatTimeDifference } from '@/utils/helpers';

export function GroupPageClient({ groupId }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { isMobile } = useWindowDimensions();

  const [viewMode, setViewMode] = useState('table');
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [editTripOpen, setEditTripOpen] = useState(false);
  const [deleteMemberOpen, setDeleteMemberOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);

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
    enabled: !!groupId && !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    setViewMode(isMobile ? 'list' : 'table');
  }, [isMobile]);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  if (!user) return <Loading text="Checking authentication..." />;
  if (isLoading) return <Loading text="Loading group..." />;

  if (error) {
    return (
      <div className="min-h-screen relative">
        <SpaceSky />
        <Topbar />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <Card className="backdrop-blur-sm bg-card/90 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Error loading group</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/home')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const group = groupData?.group || {};
  const members = groupData?.members || [];
  const trips = groupData?.trips || [];
  const currency = group.currency || '$';

  const { info, newData } = calculateMoney(members, trips, currency);

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.update_dttm || b.create_date) - new Date(a.update_dttm || a.create_date)
  );

  const getPayerName = (trip) => {
    if (!trip.payer_id) return '-/-';
    const m = members.find((m) => m.id === Number(trip.payer_id));
    return m ? m.mem_name : '-/-';
  };

  const getMemberCount = (trip) => {
    try {
      const ids = JSON.parse(trip.mem_id);
      return Array.isArray(ids) ? ids.length : 1;
    } catch { return 1; }
  };

  const tripColumns = trips.map((t) => t.trp_name);

  return (
    <div className="min-h-screen relative">
      <SpaceSky />
      <Topbar />

      <main className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold truncate flex-1">{group.grp_name || 'Group'}</h1>
          <div className="flex gap-2">
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" />
              {!isMobile && <span className="ml-1">Share</span>}
            </Button>
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={() => setChatOpen(true)}>
              <MessageSquare className="h-4 w-4" />
              {!isMobile && <span className="ml-1">Chat</span>}
            </Button>
            <Button variant="outline" size={isMobile ? 'icon' : 'sm'} onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
              {!isMobile && <span className="ml-1">Settings</span>}
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-6 pl-11">
          <Button size="sm" variant="secondary" onClick={() => { setSelectedMember(null); setEditMemberOpen(true); }}>
            <UserPlus className="h-4 w-4 mr-1" /> Add Member
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setSelectedTrip(null); setEditTripOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Trip
          </Button>
          {members.length > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={() => { setSelectedMember(members[0]); setEditMemberOpen(true); }}>
                <Pencil className="h-4 w-4 mr-1" /> Edit Member
              </Button>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setSelectedMember(members[0]); setDeleteMemberOpen(true); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete Member
              </Button>
            </>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT: Member Contributions */}
          <div className="md:col-span-8">
            <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Member Contributions</CardTitle>
                  <div className="flex gap-1 bg-muted p-1 rounded-md">
                    <Button size="sm" variant={viewMode === 'table' ? 'default' : 'ghost'} onClick={() => setViewMode('table')} className="h-7 px-2">
                      <LayoutGrid className="h-3.5 w-3.5" />
                      {!isMobile && <span className="ml-1 text-xs">Table</span>}
                    </Button>
                    <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="h-7 px-2">
                      <List className="h-3.5 w-3.5" />
                      {!isMobile && <span className="ml-1 text-xs">List</span>}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-0 pb-0">
                {members.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No members yet</p>
                ) : viewMode === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left px-4 py-2 text-muted-foreground font-medium w-8">#</th>
                          <th className="text-left px-4 py-2 text-muted-foreground font-medium">Name</th>
                          <th className="text-right px-4 py-2 text-muted-foreground font-medium">Paid</th>
                          {tripColumns.map((name) => (
                            <th key={name} className="text-right px-4 py-2 text-muted-foreground font-medium">
                              <span className="block truncate max-w-[100px]" title={name}>{name}</span>
                            </th>
                          ))}
                          <th className="text-right px-4 py-2 text-muted-foreground font-medium">Remain</th>
                          <th className="text-right px-4 py-2 text-muted-foreground font-medium">Unpaid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newData.map((row, idx) => (
                          <tr key={row.id || idx} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-medium">{row.name}</td>
                            <td className="px-4 py-2.5 text-right text-green-500 font-medium">{row.paid}</td>
                            {tripColumns.map((name) => (
                              <td key={name} className="px-4 py-2.5 text-right text-orange-400">{row[name] ?? '-/-'}</td>
                            ))}
                            <td className={`px-4 py-2.5 text-right font-medium ${String(row.remain).startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>{row.remain}</td>
                            <td className="px-4 py-2.5 text-right text-red-400">{row.unpaid}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-3 px-4 pb-4">
                    {newData.map((row, idx) => (
                      <div key={row.id || idx} className="border border-border/40 rounded-lg p-3 hover:bg-muted/20 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">{row.name}</span>
                          <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                          <div>
                            <span className="text-muted-foreground text-xs block">Paid</span>
                            <span className="text-green-500 font-medium">{row.paid}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs block">Remain</span>
                            <span className={`font-medium ${String(row.remain).startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>{row.remain}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs block">Unpaid</span>
                            <span className="text-red-400 font-medium">{row.unpaid}</span>
                          </div>
                        </div>
                        {tripColumns.length > 0 && (
                          <div className="border-t border-border/30 pt-2 mt-1">
                            <span className="text-xs text-muted-foreground mb-1 block">Trip shares:</span>
                            <div className="flex flex-wrap gap-2">
                              {tripColumns.map((name) => (
                                <div key={name} className="text-xs bg-muted rounded px-2 py-1">
                                  <span className="text-muted-foreground">{name}:</span>{' '}
                                  <span className="text-orange-400">{row[name] ?? '-/-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Trips + Summary */}
          <div className="md:col-span-4 space-y-4">
            <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Trips</CardTitle>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedTrip(null); setEditTripOpen(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-0.5" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {sortedTrips.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-6">No trips yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Name</th>
                          <th className="text-right px-3 py-1.5 text-muted-foreground font-medium">Amount</th>
                          <th className="text-right px-3 py-1.5 text-muted-foreground font-medium hidden sm:table-cell">Payer</th>
                          <th className="text-right px-3 py-1.5 text-muted-foreground font-medium hidden sm:table-cell">Mbrs</th>
                          <th className="text-right px-3 py-1.5 text-muted-foreground font-medium">Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTrips.map((trip, idx) => (
                          <tr key={trip.id || idx} className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => { setSelectedTrip(trip); setEditTripOpen(true); }}>
                            <td className="px-3 py-2 font-medium truncate max-w-[100px]" title={trip.trp_name}>{trip.trp_name}</td>
                            <td className="px-3 py-2 text-right text-green-500">{currency}{parseFloat(trip.spend || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground hidden sm:table-cell">{getPayerName(trip)}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground hidden sm:table-cell">{getMemberCount(trip)}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{formatTimeDifference(trip.update_dttm || trip.create_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: 'Total Members', value: info.totalMember, color: '' },
                  { label: 'Total Paid', value: info.totalPaid, color: 'text-green-500' },
                  { label: 'Total Spend', value: info.totalSpend, color: 'text-orange-400' },
                  { label: 'Total Remain', value: info.totalRemain, color: 'text-blue-400' },
                  { label: 'Total Unpaid', value: info.totalUnPaid, color: 'text-red-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <EditMember open={editMemberOpen} onClose={() => setEditMemberOpen(false)} groupId={groupId} member={selectedMember} />
      <EditTrip open={editTripOpen} onClose={() => setEditTripOpen(false)} groupId={groupId} trip={selectedTrip} members={members} />
      <DeleteMember open={deleteMemberOpen} onClose={() => setDeleteMemberOpen(false)} groupId={groupId} member={selectedMember} />
      <ChatWithDatabase open={chatOpen} onClose={() => setChatOpen(false)} groupId={groupId} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} group={group} />
      <GroupVisibilitySettings open={settingsOpen} onClose={() => setSettingsOpen(false)} group={group} groupId={groupId} />
    </div>
  );
}
