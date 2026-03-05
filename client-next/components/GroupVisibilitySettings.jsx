'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Trash2, Send, Link2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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

export function GroupVisibilitySettings({ open, onClose, group, groupId }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    grp_name: '',
    description: '',
    visibility: 'public',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [telegramGroupChatId, setTelegramGroupChatId] = useState('');
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramLinking, setTelegramLinking] = useState(false);

  const updateMutation = useUpdateGroupVisibility(groupId);
  const deleteMutation = useDeleteGroup();

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
      const newWindow = window.open('', '_blank');
      const res = await api.getTelegramLink();
      if (res.data?.status && res.data?.link) {
        if (newWindow) {
          newWindow.location.href = res.data.link;
        } else {
          window.location.href = res.data.link;
        }
        toast.success('Opening Telegram bot...');
      } else {
        if (newWindow) newWindow.close();
        toast.error('Failed to generate Telegram link');
      }
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
                    Link personal chat and optionally a Telegram group chat ID
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
                  <Link2 className="mr-2 h-4 w-4" /> Open Bot
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
