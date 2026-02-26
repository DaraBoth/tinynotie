'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileText, Plus, Minus, Users, CreditCard } from 'lucide-react';
import { useAddTrip, useUpdateTrip } from '@/hooks/useQueries';
import { parseMemIds } from '@/utils/helpers';
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

export function EditTrip({ open, onClose, groupId, trip, members = [], currency = '$' }) {
  const isEditing = !!trip;

  const [tripName, setTripName]           = useState('');
  const [spend, setSpend]                 = useState('');
  const [chip, setChip]                   = useState(null);
  const [custom, setCustom]               = useState('');
  const [payerId, setPayerId]             = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [eachMember, setEachMember]       = useState(false);

  const addMutation    = useAddTrip(groupId);
  const updateMutation = useUpdateTrip(groupId);
  const isPending = addMutation.isPending || updateMutation.isPending;

  const chips = CHIPS[currency] || CHIPS.default;

  useEffect(() => {
    if (!open) return;
    setChip(null);
    setCustom('');
    setEachMember(false);
    if (trip) {
      const parsed = parseMemIds(trip.mem_id);
      setSelectedMemberIds(parsed);
      setTripName(trip.trp_name || '');
      setSpend(trip.spend ? String(trip.spend) : '');
      setPayerId(trip.payer_id ? String(trip.payer_id) : '');
    } else {
      setSelectedMemberIds(members.map((m) => m.id));
      setTripName('');
      setSpend('');
      setPayerId(members[0] ? String(members[0].id) : '');
    }
  }, [open, trip, members]);

  const toggleMember = (id) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyChip = (delta) => {
    const amount = chip !== null ? chip : parseFloat(custom || 0);
    if (isNaN(amount) || amount <= 0) return;
    setSpend((prev) => String(Math.max(0, (parseFloat(prev) || 0) + delta * amount)));
  };

  const computedTotal = () => {
    const base = parseFloat(spend) || 0;
    if (eachMember && selectedMemberIds.length > 1) return base * selectedMemberIds.length;
    return base;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tripName.trim()) { toast.error('Trip name is required'); return; }
    const price = parseFloat(spend);
    if (isNaN(price) || price <= 0) { toast.error('Enter a valid amount'); return; }
    if (selectedMemberIds.length === 0) { toast.error('Select at least one member'); return; }

    const finalSpend = computedTotal();
    const description = eachMember ? `Each member: ${spend}` : '';

    try {
      const data = {
        trp_name: tripName.trim(),
        spend: finalSpend,
        mem_id: JSON.stringify(selectedMemberIds),
        description,
        payer_id: payerId || null,
      };
      if (isEditing) {
        await updateMutation.mutateAsync({ tripId: trip.id, data });
      } else {
        await addMutation.mutateAsync(data);
      }
      onClose();
    } catch { /* handled by mutation */ }
  };

  if (members.length === 0 && !isEditing) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Members First</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">You need to add at least one member before creating a trip.</p>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30 sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">
              {isEditing ? 'Edit Trip' : 'Add Trip'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="trp_name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trip Name *
            </Label>
            <Input id="trp_name" placeholder="e.g. Dinner at restaurant" value={tripName}
              onChange={(e) => setTripName(e.target.value)} required className="h-11" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="spend" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Amount *
            </Label>
            <Input id="spend" type="number" min="0.01" step="0.01" placeholder="0.00"
              value={spend} onChange={(e) => setSpend(e.target.value)} className="h-11 text-lg font-semibold" />
            {eachMember && selectedMemberIds.length > 1 && (
              <p className="text-xs text-primary font-medium">
                Total: {currency}{computedTotal().toLocaleString()} ({currency}{spend || '0'} × {selectedMemberIds.length} members)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Quick Add</p>
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button key={c} type="button" onClick={() => setChip(chip === c ? null : c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${chip === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/60 border-border/40 text-foreground hover:bg-muted'}`}>
                  {currency}{c.toLocaleString()}
                </button>
              ))}
              <input type="number" min="0" placeholder="Custom" value={custom}
                onChange={(e) => { setCustom(e.target.value); setChip(null); }}
                className="w-20 px-2 py-1.5 rounded-lg text-xs border border-border/40 bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5 h-9" onClick={() => applyChip(1)}>
                <Plus className="h-3.5 w-3.5" />
                Add {chip !== null ? `${currency}${chip.toLocaleString()}` : custom ? `${currency}${custom}` : ''}
              </Button>
              <Button type="button" variant="outline" size="sm"
                className="flex-1 gap-1.5 h-9 text-red-400 hover:text-red-400 border-red-400/30 hover:bg-red-400/10"
                onClick={() => applyChip(-1)}>
                <Minus className="h-3.5 w-3.5" />
                Subtract
              </Button>
            </div>
          </div>

          <button type="button" onClick={() => setEachMember((p) => !p)}
            className="w-full flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-border/40 bg-muted/30 hover:bg-muted/50 transition-colors text-left">
            <div className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${eachMember ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${eachMember ? 'left-[22px]' : 'left-0.5'}`} />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Each member pays this amount</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total = amount × number of selected members</p>
            </div>
          </button>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Split Between *
            </Label>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border/40 bg-muted/20">
              {members.map((m) => (
                <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedMemberIds.includes(m.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/60 border-border/40 text-foreground hover:bg-muted'}`}>
                  {m.mem_name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selectedMemberIds.length} of {members.length} selected</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Paid By
            </Label>
            <Select value={payerId} onValueChange={setPayerId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.mem_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2 flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1" disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Saving' : isEditing ? 'Save Changes' : 'Add Trip'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
