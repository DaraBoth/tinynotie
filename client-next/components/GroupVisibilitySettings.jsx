'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useUpdateGroupVisibility, useDeleteGroup } from '@/hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function GroupVisibilitySettings({ open, onClose, group, groupId }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    grp_name: '',
    description: '',
    visibility: 'public',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateMutation = useUpdateGroupVisibility(groupId);
  const deleteMutation = useDeleteGroup();

  useEffect(() => {
    if (group) {
      setFormData({
        grp_name: group.grp_name || '',
        description: group.description || '',
        visibility: group.visibility || 'public',
      });
    }
  }, [group, open]);

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/20 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-3xl">
        <div className="relative overflow-y-auto max-h-[90dvh]">
          {/* Header with decorative bg */}
          <div className="relative px-6 pt-10 pb-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 -z-10" />
            <DialogHeader className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-inner">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground uppercase tracking-widest">Group Settings</DialogTitle>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-70">Manage your group's profile & access</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 pb-8 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                {/* Group Name */}
                <div className="space-y-2">
                  <Label htmlFor="grp_name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 px-1">
                    Group Name
                  </Label>
                  <Input
                    id="grp_name"
                    name="grp_name"
                    value={formData.grp_name}
                    onChange={handleChange}
                    placeholder="Enter group name"
                    className="h-12 bg-muted/20 border-border/30 rounded-2xl focus:ring-1 focus:ring-primary/50 transition-all font-semibold"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 px-1">
                    Description
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="flex w-full rounded-2xl border border-border/30 bg-muted/20 px-4 py-3 text-sm shadow-sm transition-all focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 resize-none font-medium"
                    placeholder="What's this group for?"
                  />
                </div>

                {/* Visibility Toggle - Redesigned */}
                <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${formData.visibility === 'public'
                    ? 'bg-primary/5 border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)]'
                    : 'bg-muted/10 border-border/20'
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.visibility === 'public' ? 'bg-primary/20' : 'bg-muted/20'
                      }`}>
                      {formData.visibility === 'public' ? (
                        <Eye className="h-6 w-6 text-primary" />
                      ) : (
                        <EyeOff className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold uppercase tracking-widest">Public Group</div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight opacity-70">
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
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-muted/40">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="flex-1 h-12 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  {updateMutation.isPending ? 'Syncing...' : 'Save Profile'}
                </Button>
              </div>
            </form>

            {/* Danger Zone - Premium Redesign */}
            <div className="pt-4">
              <div className="p-1 rounded-[2rem] bg-gradient-to-br from-destructive/20 to-transparent">
                <div className="bg-background/40 backdrop-blur-md rounded-[1.8rem] p-6 space-y-4 border border-destructive/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-destructive uppercase tracking-widest">Danger Zone</div>
                      <p className="text-[10px] text-muted-foreground font-medium">Permanently remove this group</p>
                    </div>
                  </div>

                  {!showDeleteConfirm ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full h-11 border border-destructive/20 text-destructive hover:bg-destructive/10 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                    >
                      Delete Group
                    </Button>
                  ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-center text-[10px] font-bold text-destructive uppercase tracking-tight">
                        Confirming will delete all data. Continue?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase"
                        >
                          No, Keep it
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-destructive/20"
                        >
                          {deleteMutation.isPending ? 'Removing...' : 'Yes, Delete'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  );
}
