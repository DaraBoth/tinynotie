'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useDeleteMember, useDeleteTrip } from '@/hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE = '__none__';

export function DeleteMember({ open, onClose, groupId, member, members = [], trips = [] }) {
  const [selectedMemberId, setSelectedMemberId] = useState(NONE);
  const [selectedTripId,   setSelectedTripId]   = useState(NONE);

  const deleteMemberMutation = useDeleteMember(groupId);
  const deleteTripMutation   = useDeleteTrip(groupId);

  const isPending = deleteMemberMutation.isPending || deleteTripMutation.isPending;

  useEffect(() => {
    if (open) {
      setSelectedMemberId(member ? String(member.id) : NONE);
      setSelectedTripId(NONE);
    }
  }, [open, member]);

  const handleDelete = async () => {
    if (selectedMemberId === NONE && selectedTripId === NONE) return;
    try {
      if (selectedMemberId !== NONE) {
        await deleteMemberMutation.mutateAsync(Number(selectedMemberId));
      }
      if (selectedTripId !== NONE) {
        await deleteTripMutation.mutateAsync(Number(selectedTripId));
      }
      onClose();
    } catch { /* handled by mutation */ }
  };

  const nothingSelected = selectedMemberId === NONE && selectedTripId === NONE;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-bold">Delete</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Delete member */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Member to Delete
            </Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a member (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.mem_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMemberId !== NONE && (
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> This cannot be undone
              </p>
            )}
          </div>

          {/* Delete trip */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trip to Delete
            </Label>
            <Select value={selectedTripId} onValueChange={setSelectedTripId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a trip (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {trips.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.trp_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1" disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}
            className="flex-1" disabled={isPending || nothingSelected}>
            {isPending ? 'Deleting…' : 'Delete Selected'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
