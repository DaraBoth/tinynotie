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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Group Settings
          </DialogTitle>
          <DialogDescription>
            Manage group information and visibility
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grp_name">Group Name</Label>
              <Input
                id="grp_name"
                name="grp_name"
                value={formData.grp_name}
                onChange={handleChange}
                placeholder="Group name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder="Add a description…"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {formData.visibility === 'public' ? (
                  <Eye className="h-5 w-5 text-primary" />
                ) : (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <div className="font-medium">Public Group</div>
                  <div className="text-sm text-muted-foreground">
                    Anyone can view this group with the link
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete this group and all its data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full"
              >
                Delete Group
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-destructive">
                  Are you absolutely sure?
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex-1"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
