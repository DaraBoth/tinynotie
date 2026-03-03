'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useGroup } from '@/hooks/useQueries';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { SpaceSky } from '@/components/SpaceSky';
import { Loading } from '@/components/Loading';
import { TableComponent } from '@/components/TableComponent';
import { EditTrip } from '@/components/EditTrip';
import { EditMember } from '@/components/EditMember';
import { DeleteMember } from '@/components/DeleteMember';
import { ChatWithDatabase } from '@/components/ChatWithDatabase';
import { ShareModal } from '@/components/ShareModal';
import { GroupVisibilitySettings } from '@/components/GroupVisibilitySettings';
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Share2,
  Settings,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import { calculateTotalExpenses, calculateGroupBalance, formatNumber } from '@/utils/helpers';
import * as XLSX from 'xlsx';
import { api } from '@/api/apiClient';
import { toast } from 'sonner';

export default function GroupPageContent() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId;

  const { user, isAuthenticated } = useAuthStore();
  const { viewMode, setViewMode } = useUIStore();
  const { isMobile } = useWindowDimensions();

  const { data: groupData, isLoading, error } = useGroup(groupId);

  // Dialog states
  const [openTripDialog, setOpenTripDialog] = useState(false);
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);

  // Edit states
  const [editingTrip, setEditingTrip] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  // View mode initialization
  const [viewModeInitialized, setViewModeInitialized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Initialize view mode based on device
  useEffect(() => {
    if (!viewModeInitialized) {
      if (viewMode === null) {
        setViewMode(isMobile ? 'list' : 'table');
      }
      setViewModeInitialized(true);
    }
  }, [isMobile, viewMode, setViewMode, viewModeInitialized]);

  // Calculations
  const totalExpenses = useMemo(() => {
    if (!groupData?.trips) return 0;
    return calculateTotalExpenses(groupData.trips);
  }, [groupData?.trips]);

  const groupBalance = useMemo(() => {
    if (!groupData?.members || !groupData?.trips) return 0;
    return calculateGroupBalance(groupData.members, groupData.trips);
  }, [groupData?.members, groupData?.trips]);

  const handleAddTrip = () => {
    setEditingTrip(null);
    setOpenTripDialog(true);
  };

  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setOpenTripDialog(true);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setOpenMemberDialog(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setOpenMemberDialog(true);
  };

  const handleDeleteMember = (member) => {
    setDeletingMember(member);
    setOpenDeleteDialog(true);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'list' : 'table');
  };

  const handleExportMembers = () => {
    if (!members.length) return;

    // Prepare data
    const exportData = members.map(m => ({
      'Name': m.mem_name,
      'Total Paid': m.paid || 0,
      'Total Spent': trips?.filter(t => t.mem_id === m.id).reduce((sum, t) => sum + (parseFloat(t.spend) || 0), 0) || 0,
      'Balance': calculateGroupBalance([m], trips)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `${group.grp_name}_Members.xlsx`);
    toast.success('Excel exported successfully!');
  };

  const handleShareMembers = async () => {
    try {
      await api.shareMembersToTelegram({ groupId });
      toast.success('Member summary shared to Telegram!');
    } catch (err) {
      console.error('Share members error:', err);
      toast.error('Failed to share to Telegram.');
    }
  };

  if (isLoading) {
    return <Loading text="Loading group..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Failed to load group. {error.message}
            </p>
            <Button asChild>
              <Link href="/home">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const group = groupData?.group || {};
  const members = groupData?.members || [];
  const trips = groupData?.trips || [];

  return (
    <TooltipProvider>
      <main className="relative min-h-screen pb-20">
        <SpaceSky />

        <div className="relative z-10 container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="icon">
                <Link href="/home">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{group.grp_name}</h1>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleViewMode}
                    className="cursor-pointer"
                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                  >
                    {viewMode === 'table' ? (
                      <LayoutList className="h-4 w-4" />
                    ) : (
                      <LayoutGrid className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {viewMode === 'table' ? 'List View' : 'Table View'}
                </TooltipContent>
              </Tooltip>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpenChatDialog(true)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpenShareDialog(true)}
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpenSettingsDialog(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="backdrop-blur-sm bg-card/80 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">฿{formatNumber(totalExpenses)}</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-card/80 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{members.length}</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-card/80 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{trips.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Members Section */}
          <Card className="backdrop-blur-sm bg-card/80 border-primary/20 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Members</CardTitle>
                <Button onClick={handleAddMember} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TableComponent
                data={members}
                type="members"
                viewMode={viewMode}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onExport={handleExportMembers}
                onShare={handleShareMembers}
                trips={trips}
              />
            </CardContent>
          </Card>

          {/* Trips Section */}
          <Card className="backdrop-blur-sm bg-card/80 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Expense Trips</CardTitle>
                <Button onClick={handleAddTrip} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Trip
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TableComponent
                data={trips}
                type="trips"
                viewMode={viewMode}
                onEdit={handleEditTrip}
                members={members}
              />
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <EditTrip
          open={openTripDialog}
          onOpenChange={setOpenTripDialog}
          groupId={groupId}
          members={members}
          trip={editingTrip}
        />

        <EditMember
          open={openMemberDialog}
          onOpenChange={setOpenMemberDialog}
          groupId={groupId}
          member={editingMember}
        />

        <DeleteMember
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          member={deletingMember}
          groupId={groupId}
        />

        <ChatWithDatabase
          open={openChatDialog}
          onOpenChange={setOpenChatDialog}
          groupId={groupId}
        />

        <ShareModal
          open={openShareDialog}
          onOpenChange={setOpenShareDialog}
          group={group}
        />

        <GroupVisibilitySettings
          open={openSettingsDialog}
          onOpenChange={setOpenSettingsDialog}
          groupId={groupId}
          currentVisibility={group.grp_visibility}
        />
      </main>
    </TooltipProvider>
  );
}
