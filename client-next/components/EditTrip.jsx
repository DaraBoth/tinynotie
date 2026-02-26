'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileText, DollarSign, Users, CreditCard } from 'lucide-react';
import { useAddTrip, useUpdateTrip } from '@/hooks/useQueries';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { parseMemIds } from '@/utils/helpers';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function EditTrip({ open, onClose, groupId, trip, members = [] }) {
  const isEditing = !!trip;
  const { isMobile, isGalaxyFold, isIPhoneSE } = useWindowDimensions();

  const [formData, setFormData] = useState({
    trp_name: '',
    spend: '',
    description: '',
    payer_id: '',
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const addMutation = useAddTrip(groupId);
  const updateMutation = useUpdateTrip(groupId);

  useEffect(() => {
    if (!open) return;
    if (trip) {
      const parsed = parseMemIds(trip.mem_id);
      setSelectedMemberIds(parsed);
      setFormData({
        trp_name: trip.trp_name || '',
        spend: trip.spend || '',
        description: trip.description || '',
        payer_id: trip.payer_id ? String(trip.payer_id) : '',
      });
    } else {
      // Default: all members selected
      setSelectedMemberIds(members.map((m) => m.id));
      setFormData({
        trp_name: '',
        spend: '',
        description: '',
        payer_id: members[0] ? String(members[0].id) : '',
      });
    }
  }, [trip, members, open]);

  const toggleMember = (id) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.trp_name.trim()) {
      toast.error('Please enter a trip name');
      return;
    }
    const price = parseFloat(formData.spend);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (selectedMemberIds.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    try {
      const data = {
        trp_name: formData.trp_name,
        spend: price,
        mem_id: JSON.stringify(selectedMemberIds),
        description: formData.description,
        payer_id: formData.payer_id || null,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ tripId: trip.id, data });
      } else {
        await addMutation.mutateAsync(data);
      }
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const dialogClass = isGalaxyFold
    ? 'max-w-[95%] p-3'
    : isIPhoneSE
    ? 'max-w-[90%] p-4'
    : isMobile
    ? 'max-w-[85%] p-4'
    : 'max-w-lg';

  if (members.length === 0 && !isEditing) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle>Add Member First</DialogTitle>
            <DialogDescription>
              You need to add at least one member before creating a trip.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={dialogClass} style={{ zIndex: 1400 }}>
        <DialogHeader>
          <DialogTitle className={isGalaxyFold ? 'text-base' : 'text-lg'}>
            {isEditing ? 'Edit Trip' : 'Add New Trip'}
          </DialogTitle>
          <DialogDescription className={isGalaxyFold ? 'text-xs' : 'text-sm'}>
            {isEditing ? 'Update trip information' : 'Add a new shared expense'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="trp_name" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Name *
            </Label>
            <Input id="trp_name" name="trp_name" placeholder="Dinner at restaurant" value={formData.trp_name} onChange={handleChange} required />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="spend" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Amount *
            </Label>
            <Input id="spend" name="spend" type="number" step="0.01" min="0.01" placeholder="0.00" value={formData.spend} onChange={handleChange} required />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Description
            </Label>
            <Input id="description" name="description" placeholder="Optional" value={formData.description} onChange={handleChange} />
          </div>

          {/* Members (multi-select toggle) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Split Between *
            </Label>
            <div className="flex flex-wrap gap-2 border border-border rounded-md p-3">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedMemberIds.includes(member.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {member.mem_name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMemberIds.length} member{selectedMemberIds.length !== 1 ? 's' : ''} selected — cost split equally
            </p>
          </div>

          {/* Payer */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Paid by
            </Label>
            <Select value={formData.payer_id} onValueChange={(v) => setFormData((p) => ({ ...p, payer_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent style={{ zIndex: 1500 }}>
                {members.map((member) => (
                  <SelectItem key={member.id} value={String(member.id)}>
                    {member.mem_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className={`gap-2 ${isMobile ? 'flex-col-reverse' : ''}`}>
            <Button type="button" variant="outline" onClick={onClose} className={isMobile ? 'w-full' : ''}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending} className={isMobile ? 'w-full' : ''}>
              {addMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update Trip' : 'Add Trip'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
