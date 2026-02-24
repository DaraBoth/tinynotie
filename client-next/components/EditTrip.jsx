'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileText, DollarSign, User, Coins } from 'lucide-react';
import { useAddTrip, useUpdateTrip } from '@/hooks/useQueries';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'THB', 'VND', 'SGD', 'MYR',
  'IDR', 'PHP', 'INR', 'AUD', 'CAD', 'CHF', 'NZD', 'HKD', 'TWD',
];

export function EditTrip({ open, onClose, groupId, trip, members = [] }) {
  const isEditing = !!trip;
  const { isMobile, isGalaxyFold, isIPhoneSE } = useWindowDimensions();
  
  const [formData, setFormData] = useState({
    trip_description: '',
    trip_price: '',
    trip_currency: 'USD',
    member_id: '',
  });

  const addMutation = useAddTrip(groupId);
  const updateMutation = useUpdateTrip(groupId);

  useEffect(() => {
    if (trip) {
      setFormData({
        trip_description: trip.trip_description || '',
        trip_price: trip.trip_price || '',
        trip_currency: trip.trip_currency || 'USD',
        member_id: trip.member_id || '',
      });
    } else {
      setFormData({
        trip_description: '',
        trip_price: '',
        trip_currency: 'USD',
        member_id: members[0]?.member_id || '',
      });
    }
  }, [trip, members, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.trip_description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const price = parseFloat(formData.trip_price);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!formData.member_id) {
      toast.error('Please select a member');
      return;
    }

    try {
      const data = {
        trip_description: formData.trip_description,
        trip_price: price,
        trip_currency: formData.trip_currency,
        member_id: formData.member_id,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          tripId: trip.trip_id,
          data,
        });
      } else {
        await addMutation.mutateAsync(data);
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

  const handleSelectChange = (name, value) => {
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
            {isEditing ? 'Update trip information' : 'Add a new expense to the group'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trip_description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description *
            </Label>
            <Input
              id="trip_description"
              name="trip_description"
              type="text"
              placeholder="Dinner at restaurant"
              value={formData.trip_description}
              onChange={handleChange}
              required
              className={isGalaxyFold ? 'text-sm' : ''}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trip_price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price *
              </Label>
              <Input
                id="trip_price"
                name="trip_price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.trip_price}
                onChange={handleChange}
                required
                className={isGalaxyFold ? 'text-sm' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trip_currency" className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Currency
              </Label>
              <Select
                value={formData.trip_currency}
                onValueChange={(value) => handleSelectChange('trip_currency', value)}
              >
                <SelectTrigger className={isGalaxyFold ? 'text-sm' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ zIndex: 1500 }}>
                  {COMMON_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member_id" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Member *
            </Label>
            <Select
              value={formData.member_id}
              onValueChange={(value) => handleSelectChange('member_id', value)}
            >
              <SelectTrigger className={isGalaxyFold ? 'text-sm' : ''}>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent style={{ zIndex: 1500 }}>
                {members.map((member) => (
                  <SelectItem key={member.member_id} value={member.member_id}>
                    {member.member_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={`text-muted-foreground ${isGalaxyFold ? 'text-xs' : 'text-sm'}`}>
              Who spent this money?
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
                ? 'Update Trip'
                : 'Add Trip'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
