'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, Plus, Minus } from 'lucide-react';
import { useAddMember, useUpdateMember } from '@/hooks/useQueries';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetBody,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/* Quick-amount chips per currency symbol */
const CHIPS = {
  $: [5, 10, 20, 50, 100],
  AUD: [5, 10, 20, 50, 100],
  '\u0e3f': [20, 50, 100, 200, 500],
  '\u20a9': [1000, 5000, 10000, 50000, 100000],
  '\u20ab': [10000, 50000, 100000, 200000, 500000],
  '\u17db': [1000, 5000, 10000, 20000, 50000],
  W: [1000, 5000, 10000, 50000, 100000],
  R: [2000, 5000, 10000, 20000, 50000],
  default: [5, 10, 20, 50, 100],
};

export function EditMember({ open, onClose, groupId, member, members = [], editMode = false, currency = '$' }) {
  const isEditing = editMode;

  const [pickedMember, setPickedMember] = useState(null);
  const [name, setName] = useState('');
  const [paid, setPaid] = useState('');
  const [chip, setChip] = useState(null);
  const [custom, setCustom] = useState('');

  const addMutation = useAddMember(groupId);
  const updateMutation = useUpdateMember(groupId);
  const isPending = addMutation.isPending || updateMutation.isPending;

  const chips = CHIPS[currency] || CHIPS.default;

  useEffect(() => {
    if (open) {
      setPickedMember(null);
      setName(member?.mem_name || '');
      setPaid(member?.paid ? String(member.paid) : '');
      setChip(null);
      setCustom('');
    }
  }, [open, member]);

  useEffect(() => {
    if (isEditing && pickedMember) {
      setName(pickedMember.mem_name || '');
      setPaid(pickedMember.paid ? String(pickedMember.paid) : '');
    }
  }, [pickedMember, isEditing]);

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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        title={isEditing ? 'Edit Member' : 'Add Member'}
        description="Manage group member payment information"
      >
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <SheetTitle>{isEditing ? 'Edit Member' : 'Add Member'}</SheetTitle>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <SheetBody>
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
                      <SelectItem key={m.id} value={String(m.id)}>
                        <span className="font-medium">{m.mem_name}</span>
                        <span className="ml-2 text-muted-foreground text-xs">{currency}{parseFloat(m.paid || 0).toLocaleString()} paid</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Member name (add mode) */}
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
                  autoFocus
                />
              </div>
            )}

            {/* Amount paid */}
            <div className="space-y-1.5">
              <Label htmlFor="paid" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Amount Paid
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">{currency}</span>
                <Input
                  id="paid"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  className="h-11 text-lg font-semibold pl-8"
                />
              </div>
            </div>

            {/* Quick chips */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Quick Add</p>
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <button key={c} type="button"
                    onClick={() => setChip(chip === c ? null : c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${chip === c
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-muted/60 border-border/40 text-foreground hover:bg-muted hover:border-border'
                      }`}>
                    {currency}{c.toLocaleString()}
                  </button>
                ))}
                <input
                  type="number"
                  min="0"
                  placeholder="Custom"
                  value={custom}
                  onChange={(e) => { setCustom(e.target.value); setChip(null); }}
                  className="w-24 px-3 py-1.5 rounded-lg text-xs border border-border/40 bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* +/- buttons */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5 h-10"
                  onClick={() => applyChip(1)}
                  disabled={chip === null && !custom}>
                  <Plus className="h-3.5 w-3.5" />
                  Add {chip !== null ? `${currency}${chip.toLocaleString()}` : custom ? `${currency}${custom}` : ''}
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5 h-10 text-red-400 hover:text-red-400 border-red-400/30 hover:bg-red-400/10"
                  onClick={() => applyChip(-1)}
                  disabled={chip === null && !custom}>
                  <Minus className="h-3.5 w-3.5" />
                  Subtract
                </Button>
              </div>
            </div>

            {/* Current unpaid info for editing */}
            {isEditing && pickedMember && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Current Status</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold text-green-500">{currency}{parseFloat(pickedMember.paid || 0).toLocaleString()}</span>
                </div>
                {pickedMember.unpaid !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unpaid</span>
                    <span className="font-semibold text-red-400">{currency}{parseFloat(pickedMember.unpaid || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </SheetBody>

          <SheetFooter>
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1" disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending || (isEditing && !pickedMember)}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Member'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
