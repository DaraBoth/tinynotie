'use client';

import { useState } from 'react';
import { Share2, Copy, Check, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export function ShareModal({ open, onClose, group }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/groups/${group?.grp_id}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: group?.grp_name || 'Join my group',
          text: `Join my expense tracking group: ${group?.grp_name}`,
          url: shareUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Group
          </DialogTitle>
          <DialogDescription>
            Share this group with others to collaborate on expenses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{group?.grp_name}</h3>
              {group?.grp_description && (
                <p className="text-sm text-muted-foreground">
                  {group.grp_description}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>Group Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={handleCopy} className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button onClick={handleShare} className="w-full">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Note:</p>
            <p>
              Anyone with this link can view the group. Make sure to only share it with
              trusted people.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
