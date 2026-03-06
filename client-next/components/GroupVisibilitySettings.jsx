'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Trash2, Send, Link2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateGroupVisibility, useDeleteGroup } from '@/hooks/useQueries';
import { api } from '@/api/apiClient';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

const TELEGRAM_BOT_URL = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/tinynotie_bot';

export function GroupVisibilitySettings({ open, onClose, group, groupId, groupUsers: initialGroupUsers = [], isAdmin: isAdminProp = false }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    grp_name: '',
    description: '',
    visibility: 'public',
  });
  const [groupUsers, setGroupUsers] = useState([]);
  const [updatingPermissionUserId, setUpdatingPermissionUserId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [telegramGroupChatId, setTelegramGroupChatId] = useState('');
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramLinking, setTelegramLinking] = useState(false);

  const updateMutation = useUpdateGroupVisibility(groupId);
  const deleteMutation = useDeleteGroup();
  const isAdmin = !!(isAdminProp || group?.isAdmin);

  useEffect(() => {
    if (group) {
      setFormData({
        grp_name: group.grp_name || '',
        description: group.description || '',
        visibility: group.visibility || 'public',
      });

      if (group.telegram_chat_id) {
        setTelegramGroupChatId(String(group.telegram_chat_id));
      }
    }
  }, [group, open]);

  useEffect(() => {
    if (!open || !groupId) return;

    const loadTelegramStatus = async () => {
      try {
        setTelegramLoading(true);
        const res = await api.getTelegramLinkStatus(groupId);
        if (res.data?.status) {
          setTelegramStatus(res.data.data || null);
          if (res.data.data?.linked_group_chat?.id) {
            setTelegramGroupChatId(String(res.data.data.linked_group_chat.id));
          }
        }
      } catch (error) {
        console.error('Load telegram status error:', error);
      } finally {
        setTelegramLoading(false);
      }
    };

    loadTelegramStatus();
  }, [open, groupId]);

  useEffect(() => {
    if (!open || !groupId || !isAdmin) return;

    const loadGroupUsers = async () => {
      try {
        const res = await api.getGroupUsers(groupId);
        if (res.data?.status) {
          setGroupUsers(res.data.data || []);
        }
      } catch (error) {
        console.error('Load group users error:', error);
      }
    };

    loadGroupUsers();
  }, [open, groupId, isAdmin]);

  useEffect(() => {
    if (!open) return;
    setGroupUsers(Array.isArray(initialGroupUsers) ? initialGroupUsers : []);
  }, [open, initialGroupUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.grp_name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        visibility: formData.visibility,
        grp_name: formData.grp_name.trim(),
        description: formData.description.trim(),
      });
      toast.success('Group settings saved');
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(groupId);
      toast.success('Group deleted successfully');
      router.push('/home');
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenTelegramBot = async () => {
    try {
      const popup = window.open(TELEGRAM_BOT_URL, '_blank');
      if (!popup) window.location.href = TELEGRAM_BOT_URL;
      toast.success('Opening Telegram bot...');
    } catch (error) {
      toast.error('Error opening Telegram bot');
    }
  };

  const handleLinkTelegramGroupChat = async () => {
    const chatId = Number(telegramGroupChatId);
    if (!Number.isFinite(chatId)) {
      toast.error('Please enter a valid numeric Telegram group chat ID');
      return;
    }

    try {
      setTelegramLinking(true);
      const res = await api.linkTelegramGroupChat({
        group_id: Number(groupId),
        group_chat_id: chatId,
      });

      if (res.data?.status) {
        toast.success(res.data.message || 'Telegram group linked successfully');
        const statusRes = await api.getTelegramLinkStatus(groupId);
        if (statusRes.data?.status) {
          setTelegramStatus(statusRes.data.data || null);
        }
      } else {
        toast.error(res.data?.message || 'Failed to link Telegram group');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to link Telegram group');
    } finally {
      setTelegramLinking(false);
    }
  };

  const handlePermissionToggle = async (targetUserId, nextCanEdit) => {
    if (!isAdmin) return;

    try {
      setUpdatingPermissionUserId(targetUserId);
      await api.updateGroupUserPermission({
        group_id: Number(groupId),
        target_user_id: targetUserId,
        can_edit: nextCanEdit,
      });

      setGroupUsers((prev) => prev.map((u) => (
        Number(u.id) === Number(targetUserId)
          ? { ...u, can_edit: !!nextCanEdit }
          : u
      )));
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast.success('Permission updated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update permission');
    } finally {
      setUpdatingPermissionUserId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <SheetContent
        side="right"
        title="Group Settings"
        description="Manage group details, visibility, and Telegram linking"
        className="w-full sm:max-w-lg p-0 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Group Settings
          </SheetTitle>
          <SheetDescription>
            Manage group details and visibility settings
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6 pb-24">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="grp_name" className="text-xs font-semibold">
                Group Name
              </Label>
              <Input
                id="grp_name"
                name="grp_name"
                value={formData.grp_name}
                onChange={handleChange}
                placeholder="Enter group name"
                className="h-10"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold">
                Description
              </Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-none"
                placeholder="What's this group for?"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/30 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {formData.visibility === 'public' ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">Public Group</div>
                  <div className="text-xs text-muted-foreground">
                    Accessible via direct link
                  </div>
                </div>
              </div>
              <Switch
                checked={formData.visibility === 'public'}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, visibility: checked ? 'public' : 'private' }))
                }
              />
            </div>

            {/* Telegram Linking */}
            <div className="space-y-3 p-4 rounded-lg border border-border/30 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Send className="h-4 w-4 text-sky-500" /> Telegram Linking
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Personal chat links automatically when you register via bot. Optionally link a Telegram group chat ID.
                  </div>
                </div>
                {telegramStatus?.group_chat_linked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Linked
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Not linked</span>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold">Telegram Group Chat ID</Label>
                <Input
                  value={telegramGroupChatId}
                  onChange={(e) => setTelegramGroupChatId(e.target.value)}
                  placeholder="Example: -1001234567890"
                  className="h-10"
                />
                <p className="text-[11px] text-muted-foreground">
                  Add bot to the Telegram group, then run <strong>/chat_id</strong> in that group and paste the ID here.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleOpenTelegramBot}
                >
                  <Link2 className="mr-2 h-4 w-4" /> Open Bot Chat
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleLinkTelegramGroupChat}
                  disabled={telegramLinking}
                >
                  {telegramLinking ? 'Linking...' : 'Link Group Chat ID'}
                </Button>
              </div>

              {!telegramLoading && telegramStatus && (
                <div className="text-[11px] text-muted-foreground space-y-1 rounded-md border border-border/40 bg-background/50 p-2.5">
                  <div>
                    Personal chat: {telegramStatus.personal_chat_linked ? 'linked' : 'not linked'}
                  </div>
                  <div>
                    Group chat: {telegramStatus.group_chat_linked
                      ? `${telegramStatus.linked_group_chat?.title || 'Linked chat'} (${telegramStatus.linked_group_chat?.id || telegramGroupChatId})`
                      : 'not linked'}
                  </div>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="space-y-3 p-4 rounded-lg border border-border/30 bg-muted/20">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">Collaborator Permissions</div>
                  <div className="text-xs text-muted-foreground">
                    Control which invited users can edit group data.
                  </div>
                </div>

                {groupUsers.length === 0 ? (
                  <div className="text-xs text-muted-foreground rounded-md border border-border/30 bg-background/50 p-3">
                    No invited users yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-background/60 p-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{u.usernm}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email || `User #${u.id}`}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${u.can_edit ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                            {u.can_edit ? 'Can Edit' : 'Read Only'}
                          </span>
                          <Switch
                            checked={!!u.can_edit}
                            onCheckedChange={(checked) => handlePermissionToggle(u.id, checked)}
                            disabled={updatingPermissionUserId === u.id}
                            aria-label={`Set edit permission for ${u.usernm}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Danger Zone */}
            <div className="pt-4 space-y-3 border-t">
              <h3 className="text-xs font-semibold text-destructive uppercase">Danger Zone</h3>
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <p className="text-xs text-muted-foreground mb-3">
                  Once you delete a group, there is no going back. Please be certain.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </Button>
              </div>

              {showDeleteConfirm && (
                <div className="space-y-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-xs text-destructive font-semibold">
                    Confirming will delete all data. Continue?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="flex-1"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-background flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
