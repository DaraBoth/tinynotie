'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useDeleteMember, useDeleteTrip } from '@/hooks/useQueries';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetBody,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const NONE = '__none__';

export function DeleteMember({ open, onClose, groupId, member, members = [], trips = [] }) {
  const [selectedMemberId, setSelectedMemberId] = useState(NONE);
  const [selectedTripId, setSelectedTripId] = useState(NONE);

  const deleteMemberMutation = useDeleteMember(groupId);
  const deleteTripMutation = useDeleteTrip(groupId);

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
  const hasSelection = !nothingSelected;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        title="Delete Member or Trip"
        description="Permanently delete a member or a trip from this group"
      >
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <SheetTitle>Delete</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Select what to delete below</p>
            </div>
          </div>
        </SheetHeader>

        <SheetBody>
          {/* Warning banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              This action is permanent and cannot be undone. Please make sure you select the correct items.
            </p>
          </div>

          {/* Delete member */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Member to Delete
            </Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a member to delete…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    <span>{m.mem_name}</span>
                    {m.paid > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">({m.paid} paid)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border/40" />
          </div>

          {/* Delete trip */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trip to Delete
            </Label>
            <Select value={selectedTripId} onValueChange={setSelectedTripId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a trip to delete…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— None —</SelectItem>
                {trips.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    <span>{t.trp_name}</span>
                    {t.spend > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">({t.spend})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Live summary of what will be deleted */}
          {hasSelection && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 space-y-2">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide">Will be deleted:</p>
              {selectedMemberId !== NONE && (
                <p className="text-sm flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5 text-destructive shrink-0" />
                  Member: <strong>{members.find(m => String(m.id) === selectedMemberId)?.mem_name}</strong>
                </p>
              )}
              {selectedTripId !== NONE && (
                <p className="text-sm flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5 text-destructive shrink-0" />
                  Trip: <strong>{trips.find(t => String(t.id) === selectedTripId)?.trp_name}</strong>
                </p>
              )}
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1" disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}
            className="flex-1" disabled={isPending || nothingSelected}>
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
