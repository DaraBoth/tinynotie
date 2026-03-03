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
import { ScrollArea } from '@/components/ui/scroll-area';
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
        <div className="relative flex flex-col max-h-[90dvh]">
          {/* Header with decorative bg */}
          <div className="relative px-6 pt-10 pb-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 -z-10" />
            <DialogHeader className="p-8 pb-0">
              <div className="flex items-center gap-5 relative group/header">
                <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] relative overflow-hidden">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-[0.8]">
                    Group <br />
                    <span className="text-primary italic-none tracking-normal">Settings.</span>
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] italic">Access Control</p>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto">
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

              {/* Danger Zone */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 px-1">
                  <span className="h-px flex-1 bg-destructive/20" />
                  <span className="text-[10px] font-black text-destructive uppercase tracking-[0.3em] italic px-2">Danger Zone</span>
                  <span className="h-px flex-1 bg-destructive/20" />
                </div>

                <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 relative overflow-hidden group/danger">
                  <div className="absolute top-0 right-0 -tr-1/4 w-32 h-32 bg-destructive/10 blur-3xl rounded-full" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-foreground uppercase italic tracking-wider">Delete this group</h4>
                      <p className="text-xs text-muted-foreground max-w-sm font-medium">
                        Once you delete a group, there is no going back. Please be certain.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      className="bg-destructive hover:bg-destructive/90 text-white font-black uppercase tracking-widest italic shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Destroy Group
                    </Button>
                  </div>
                </div>
              </div>

              {showDeleteConfirm && (
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
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
