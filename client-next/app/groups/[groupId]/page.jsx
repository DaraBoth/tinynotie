'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, Plus, MessageSquare, Settings, ArrowLeft, Eye, Share2 } from 'lucide-react';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/Loading';
import { SpaceSky } from '@/components/SpaceSky';
import { Topbar } from '@/components/global/Topbar';
import { TableComponent } from '@/components/TableComponent';
import { EditMember } from '@/components/EditMember';
import { EditTrip } from '@/components/EditTrip';
import { DeleteMember } from '@/components/DeleteMember';
import { ChatWithDatabase  } from '@/components/ChatWithDatabase';
import { ShareModal } from '@/components/ShareModal';
import { GroupVisibilitySettings } from '@/components/GroupVisibilitySettings';
import { calculateGroupBalance, formatCurrency } from '@/utils/helpers';

export default function GroupPage({ params }) {
  const router = useRouter();
  const groupId = params.groupId;
  const user = useAuthStore((state) => state.user);
  const { isMobile } = useWindowDimensions();
  
  // View mode state
  const [viewMode, setViewMode] = useState(null);
  const [viewModeInitialized, setViewModeInitialized] = useState(false);

  // Dialog states
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [editTripOpen, setEditTripOpen] = useState(false);
  const [deleteMemberOpen, setDeleteMemberOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Selected items
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Fetch group data
  const { data: groupData, isLoading, error } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const response = await api.getGroupById (groupId);
      return response.data;
    },
    enabled: !!groupId && !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Initialize view mode based on device
  useEffect(() => {
    if (!viewModeInitialized) {
      setViewMode(isMobile ? 'list' : 'table');
      setViewModeInitialized(true);
    }
  }, [isMobile, viewModeInitialized]);

  // Handle unauthorized access
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return <Loading text="Checking authentication..." />;
  }

  if (isLoading) {
    return <Loading text="Loading group..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen relative">
        <SpaceSky />
        <Topbar />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <Card className="backdrop-blur-sm bg-card/90 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>
                Failed to load group. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/home')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
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
  const balance = calculateGroupBalance(members, trips);

  const handleAddMember = () => {
    setSelectedMember(null);
    setEditMemberOpen(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setEditMemberOpen(true);
  };

  const handleDeleteMember = (member) => {
    setSelectedMember(member);
    setDeleteMemberOpen(true);
  };

  const handleAddTrip = () => {
    setSelectedTrip(null);
    setEditTripOpen(true);
  };

  const handleEditTrip = (trip) => {
    setSelectedTrip(trip);
    setEditTripOpen(true);
  };

  const handleViewToggle = (mode) => {
    setViewMode(mode);
  };

  return (
    <div className="min-h-screen relative">
      <SpaceSky />
      <Topbar />
      
      <main className="relative z-10 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/home')}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold truncate">
                  {group.grp_name || 'Group'}
                </h1>
              </div>
              {group.grp_description && (
                <p className="text-muted-foreground ml-12">
                  {group.grp_description}
                </p>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                variant="outline"
                size={isMobile ? 'icon' : 'default'}
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Share</span>}
              </Button>
              <Button
                variant="outline"
                size={isMobile ? 'icon' : 'default'}
                onClick={() => setChatOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Chat</span>}
              </Button>
              <Button
                variant="outline"
                size={isMobile ? 'icon' : 'default'}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Settings</span>}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="backdrop-blur-sm bg-card/80">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Members</div>
                <div className="text-2xl font-bold">{members.length}</div>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-card/80">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Trips</div>
                <div className="text-2xl font-bold">{trips.length}</div>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-card/80">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Balance</div>
                <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(Math.abs(balance))}
                </div>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-card/80">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant={balance >= 0 ? 'default' : 'destructive'} className="mt-1">
                  {balance >= 0 ? 'Surplus' : 'Deficit'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Group Details</h2>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewToggle('table')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              {!isMobile && 'Table'}
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewToggle('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              {!isMobile && 'List'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Members Section */}
          <TableComponent
            title="Members"
            type="members"
            data={members}
            viewMode={viewMode}
            onAdd={handleAddMember}
            onEdit={handleEditMember}
            onDelete={handleDeleteMember}
            trips={trips}
          />

          {/* Trips Section */}
          <TableComponent
            title="Trips"
            type="trips"
            data={trips}
            viewMode={viewMode}
            onAdd={handleAddTrip}
            onEdit={handleEditTrip}
            members={members}
          />
        </div>
      </main>

      {/* Dialogs */}
      <EditMember
        open={editMemberOpen}
        onClose={() => setEditMemberOpen(false)}
        groupId={groupId}
        member={selectedMember}
      />

      <EditTrip
        open={editTripOpen}
        onClose={() => setEditTripOpen(false)}
        groupId={groupId}
        trip={selectedTrip}
        members={members}
      />

      <DeleteMember
        open={deleteMemberOpen}
        onClose={() => setDeleteMemberOpen(false)}
        groupId={groupId}
        member={selectedMember}
      />

      <ChatWithDatabase
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        groupId={groupId}
      />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        group={group}
      />

      <GroupVisibilitySettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        group={group}
        groupId={groupId}
      />
    </div>
  );
}
