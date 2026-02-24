'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, DollarSign } from 'lucide-react';
import { useAddMember, useUpdateMember } from '@/hooks/useQueries';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
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

export function EditMember({ open, onClose, groupId, member }) {
  const isEditing = !!member;
  const { isMobile, isGalaxyFold, isIPhoneSE } = useWindowDimensions();
  
  const [formData, setFormData] = useState({
    member_name: '',
    member_paid: '',
  });

  const addMutation = useAddMember(groupId);
  const updateMutation = useUpdateMember(groupId);

  useEffect(() => {
    if (member) {
      setFormData({
        member_name: member.member_name || '',
        member_paid: member.member_paid || '',
      });
    } else {
      setFormData({
        member_name: '',
        member_paid: '',
      });
    }
  }, [member, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.member_name.trim()) {
      toast.error('Please enter a member name');
      return;
    }

    const paid = parseFloat(formData.member_paid) || 0;
    if (paid < 0) {
      toast.error('Amount paid cannot be negative');
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          memberId: member.member_id,
          data: {
            member_name: formData.member_name,
            member_paid: paid,
          },
        });
      } else {
        await addMutation.mutateAsync({
          member_name: formData.member_name,
          member_paid: paid,
        });
      }
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

  // Responsive styles
  const dialogClass = isGalaxyFold
    ? 'max-w-[95%] p-3'
    : isIPhoneSE
    ? 'max-w-[90%] p-4'
    : isMobile
    ? 'max-w-[85%] p-4'
    : 'max-w-md';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={dialogClass} style={{ zIndex: 1400 }}>
        <DialogHeader>
          <DialogTitle className={isGalaxyFold ? 'text-base' : 'text-lg'}>
            {isEditing ? 'Edit Member' : 'Add New Member'}
          </DialogTitle>
          <DialogDescription className={isGalaxyFold ? 'text-xs' : 'text-sm'}>
            {isEditing
              ? 'Update member information'
              : 'Add a new member to the group'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Member Name *
            </Label>
            <Input
              id="member_name"
              name="member_name"
              type="text"
              placeholder="John Doe"
              value={formData.member_name}
              onChange={handleChange}
              required
              className={isGalaxyFold ? 'text-sm' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="member_paid" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Amount Paid
            </Label>
            <Input
              id="member_paid"
              name="member_paid"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.member_paid}
              onChange={handleChange}
              className={isGalaxyFold ? 'text-sm' : ''}
            />
            <p className={`text-muted-foreground ${isGalaxyFold ? 'text-xs' : 'text-sm'}`}>
              Total amount this member has paid for the group
            </p>
          </div>

          <DialogFooter className={`gap-2 ${isMobile ? 'flex-col-reverse' : ''}`}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={isMobile ? 'w-full' : ''}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
              className={isMobile ? 'w-full' : ''}
            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditing
                ? 'Update Member'
                : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
