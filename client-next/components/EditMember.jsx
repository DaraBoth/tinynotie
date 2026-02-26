'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, Plus, Minus } from 'lucide-react';
import { useAddMember, useUpdateMember } from '@/hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* Quick-amount chips per currency symbol */
const CHIPS = {
  $:       [5, 10, 20, 50, 100],
  AUD:     [5, 10, 20, 50, 100],
  '\u0e3f':[20, 50, 100, 200, 500],
  '\u20a9':[1000, 5000, 10000, 50000, 100000],
  '\u20ab':[10000, 50000, 100000, 200000, 500000],
  '\u17db':[1000, 5000, 10000, 20000, 50000],
  default: [5, 10, 20, 50, 100],
};

export function EditMember({ open, onClose, groupId, member, members = [], editMode = false, currency = '$' }) {
  // editMode=true means "edit existing member" (shows a picker)
  // editMode=false means "add new member"
  const isEditing = editMode;

  const [pickedMember, setPickedMember] = useState(null); // selected from dropdown in editMode
  const [name, setName]           = useState('');
  const [paid, setPaid]           = useState('');
  const [chip, setChip]           = useState(null);
  const [custom, setCustom]       = useState('');

  const addMutation    = useAddMember(groupId);
  const updateMutation = useUpdateMember(groupId);
  const isPending = addMutation.isPending || updateMutation.isPending;

  const chips = CHIPS[currency] || CHIPS.default;

  // Reset state whenever dialog opens
  useEffect(() => {
    if (open) {
      setPickedMember(null);
      setName(member?.mem_name || '');
      setPaid(member?.paid ? String(member.paid) : '');
      setChip(null);
      setCustom('');
    }
  }, [open, member]);

  // When user picks a member from the dropdown in editMode, fill fields
  useEffect(() => {
    if (editMode && pickedMember) {
      setName(pickedMember.mem_name || '');
      setPaid(pickedMember.paid ? String(pickedMember.paid) : '');
    }
  }, [pickedMember, editMode]);

  const applyChip = (delta) => {
    const amount = chip !== null ? chip : parseFloat(custom || 0);
    if (isNaN(amount) || amount <= 0) return;
    setPaid((prev) => String(Math.max(0, (parseFloat(prev) || 0) + delta * amount)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing && !pickedMember) { toast.error('Please select a member to edit'); return; }
    if (!isEditing && !name.trim()) { toast.error('Member name is required'); return; }
    const amount = parseFloat(paid) || 0;
    if (amount < 0) { toast.error('Amount cannot be negative'); return; }
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ user_id: pickedMember.id, paid: amount, group_id: groupId, type: 'UPDATE' });
      } else {
        await addMutation.mutateAsync({ mem_name: name.trim(), paid: amount });
      }
      onClose();
    } catch { /* handled by mutation */ }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">
              {isEditing ? 'Edit Member' : 'Add Member'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Member picker (edit mode only) */}
          {isEditing && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Select Member *
              </Label>
              <Select
                value={pickedMember ? String(pickedMember.id) : ''}
                onValueChange={(val) => {
                  const found = members.find((m) => String(m.id) === val);
                  setPickedMember(found || null);
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose a member to edit…" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.mem_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Member name — editable in add mode, read-only display in edit mode */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="mem_name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Member Name *
              </Label>
              <Input
                id="mem_name"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>
          )}

          {/* Amount paid */}
          <div className="space-y-1.5">
            <Label htmlFor="paid" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Amount Paid
            </Label>
            <Input
              id="paid"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={paid}
              onChange={(e) => setPaid(e.target.value)}
              className="h-11 text-lg font-semibold"
            />
          </div>

          {/* Quick chips */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Quick Add</p>
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button key={c} type="button"
                  onClick={() => setChip(chip === c ? null : c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${chip === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/60 border-border/40 text-foreground hover:bg-muted'}`}>
                  {currency}{c.toLocaleString()}
                </button>
              ))}
              <input
                type="number"
                min="0"
                placeholder="Custom"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setChip(null); }}
                className="w-20 px-2 py-1.5 rounded-lg text-xs border border-border/40 bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* +/??buttons */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5 h-9"
                onClick={() => applyChip(1)}>
                <Plus className="h-3.5 w-3.5" />
                Add {chip !== null ? `${currency}${chip.toLocaleString()}` : custom ? `${currency}${custom}` : ''}
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5 h-9 text-red-400 hover:text-red-400 border-red-400/30 hover:bg-red-400/10"
                onClick={() => applyChip(-1)}>
                <Minus className="h-3.5 w-3.5" />
                Subtract
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2 flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1" disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending || (isEditing && !pickedMember)}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
