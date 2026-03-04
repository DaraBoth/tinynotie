'use client';

import { useState } from 'react';
import { FileText, Clock, DollarSign, Users } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatTimeDifference } from '@/utils/helpers';

export function SelectTripDialog({ open, onClose, trips = [], onSelectTrip, currency = '$' }) {
  const [selectedTripId, setSelectedTripId] = useState(null);

  const handleSelect = () => {
    const trip = trips.find(t => t.id === selectedTripId);
    if (trip) {
      onSelectTrip(trip);
      onClose();
    }
  };

  const getMemberCount = (trip) => {
    try {
      const ids = JSON.parse(trip.mem_id);
      return Array.isArray(ids) ? ids.length : 1;
    } catch { return 1; }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Trip to Edit
          </SheetTitle>
          <SheetDescription>
            Choose which trip you want to edit
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-3">
            {trips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No trips found</p>
                <p className="text-xs mt-1">Add a trip to get started</p>
              </div>
            ) : (
              trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedTripId === trip.id
                      ? 'bg-primary/10 border-primary shadow-sm'
                      : 'bg-muted/30 hover:bg-muted/50 border-transparent hover:border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-sm flex-1 line-clamp-2">
                      {trip.trp_name}
                    </h3>
                    <Badge variant="secondary" className="shrink-0">
                      {currency}{trip.spend}
                    </Badge>
                  </div>
                  
                  {trip.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {trip.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{getMemberCount(trip)} member{getMemberCount(trip) > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeDifference(trip.update_dttm || trip.create_date)}</span>
                    </div>
                  </div>

                  {selectedTripId === trip.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-primary-foreground"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-background flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedTripId}
            className="flex-1"
          >
            Edit Selected Trip
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
