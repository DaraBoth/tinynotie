'use client';

import { AlertTriangle } from 'lucide-react';
import { useDeleteMember } from '@/hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function DeleteMember({ open, onClose, groupId, member }) {
  const deleteMutation = useDeleteMember(groupId);

  const handleDelete = async () => {
    if (!member) return;

    try {
      await deleteMutation.mutateAsync(member.member_id);
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Member</DialogTitle>
              <DialogDescription>
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm">
            Are you sure you want to delete{' '}
            <span className="font-semibold">{member?.member_name}</span>?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            All associated trips will remain but will show as belonging to a deleted member.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
