'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Search, UserPlus, X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-lime-500',
];

const getAvatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getAvatarInitials = (name = '') => name.slice(0, 2).toUpperCase();

export function AddUserToGroup({ open, onClose, groupId, existingMembers = [], isAdmin = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [existingGroupUserIds, setExistingGroupUserIds] = useState([]);
  
  const queryClient = useQueryClient();

  // Get existing member user IDs to exclude from search
  const existingUserIds = useMemo(
    () => existingMembers.filter((m) => m.user_id).map((m) => m.user_id),
    [existingMembers]
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);

      api.getGroupUsers(groupId)
        .then((res) => {
          const ids = (res.data?.data || []).map((u) => Number(u.id)).filter(Number.isFinite);
          setExistingGroupUserIds(ids);
        })
        .catch(() => {
          setExistingGroupUserIds([]);
        });
    }
  }, [open, groupId]);

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      if (searchResults.length > 0) {
        setSearchResults([]);
      }
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.searchUsers(searchQuery, 'ALL');
        console.log('[AddUser] Search response:', response.data);
        if (response.data.status) {
          // Filter out existing members
          const filtered = response.data.data.filter(
            user => !existingUserIds.includes(user.id) && !existingGroupUserIds.includes(user.id)
          );
          console.log('[AddUser] Filtered results:', filtered);
          console.log('[AddUser] Existing user IDs:', existingUserIds);
          setSearchResults(filtered);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to search users');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, existingUserIds, existingGroupUserIds, searchResults.length]);

  const addUsersMutation = useMutation({
    mutationFn: async (users) => {
      console.log('[AddUser] Adding users:', users);
      // Add each app user to grp_users and let server sync member display rows.
      const promises = users.map(user => {
        const payload = {
          group_id: groupId,
          user_id: user.id,
          can_edit: isAdmin ? !!user.can_edit : false,
        };
        console.log('[AddUser] Adding member payload:', payload);
        return api.addUserToGroup(payload);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success(`${selectedUsers.length} user(s) added to group!`);
      onClose();
    },
    onError: (error) => {
      console.error('[AddUser] Error adding users:', error);
      console.error('[AddUser] Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to add users. Please check console for details.';
      toast.error(message);
    },
  });

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, { ...user, can_edit: false }];
      }
    });
  };

  const updateSelectedUserPermission = (userId, canEdit) => {
    setSelectedUsers((prev) => prev.map((u) => (
      u.id === userId ? { ...u, can_edit: !!canEdit } : u
    )));
  };

  const handleAddUsers = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    addUsersMutation.mutate(selectedUsers);
  };

  const isSelected = (userId) => selectedUsers.some(u => u.id === userId);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Users to Group
          </SheetTitle>
          <SheetDescription>
            Search and add existing users to this group
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Input */}
          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="text-xs text-muted-foreground mt-2">
                Type at least 2 characters to search
              </p>
            )}
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="px-6 py-3 bg-muted/30 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Selected ({selectedUsers.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="pl-1 pr-2 py-1 gap-1.5 flex items-center"
                  >
                    <Avatar className="h-5 w-5">
                      {user.profile_url ? (
                        <AvatarImage src={user.profile_url} alt={user.usernm} />
                      ) : (
                        <AvatarFallback className={`${getAvatarColor(user.usernm)} text-[10px] text-white`}>
                          {getAvatarInitials(user.usernm)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-xs">{user.usernm}</span>
                    {isAdmin && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${user.can_edit ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                        {user.can_edit ? 'Can Edit' : 'Read Only'}
                      </span>
                    )}
                    <button
                      onClick={() => toggleUserSelection(user)}
                      className="ml-1 hover:bg-background/50 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p className="text-sm">Searching...</p>
                </div>
              ) : searchQuery.length >= 2 && searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No users found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Results ({searchResults.length})
                  </p>
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isSelected(user.id)
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-muted/30 hover:bg-muted/50 border-2 border-transparent'
                      }`}
                    >
                      <button
                        onClick={() => toggleUserSelection(user)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                      <Avatar className="h-10 w-10">
                        {user.profile_url ? (
                          <AvatarImage src={user.profile_url} alt={user.usernm} />
                        ) : (
                          <AvatarFallback className={`${getAvatarColor(user.usernm)} text-white`}>
                            {getAvatarInitials(user.usernm)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm">{user.usernm}</p>
                        {user.email && (
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        )}
                        {user.phone_number && (
                          <p className="text-xs text-muted-foreground">{user.phone_number}</p>
                        )}
                      </div>
                      {isSelected(user.id) && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="h-4 w-4 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      </button>
                      {isAdmin && isSelected(user.id) && (
                        <div className="flex items-center gap-2 rounded-lg border border-border/40 px-2 py-1 bg-background/70">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Can edit</span>
                          <Switch
                            checked={!!selectedUsers.find((u) => u.id === user.id)?.can_edit}
                            onCheckedChange={(checked) => updateSelectedUserPermission(user.id, checked)}
                            aria-label={`Set edit permission for ${user.usernm}`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Search for users</p>
                  <p className="text-xs mt-1">Enter a name, email, or phone number</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-background flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={addUsersMutation.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddUsers}
            disabled={selectedUsers.length === 0 || addUsersMutation.isPending}
            className="flex-1"
          >
            {addUsersMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
