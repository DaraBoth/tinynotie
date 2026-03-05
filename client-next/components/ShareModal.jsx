'use client';

import { useState, useEffect, useCallback } from 'react';
import { Share2, Copy, Check, Edit2, Save, Globe } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

const LANG_LABELS = { EN: 'English', KH: 'Khmer', KR: 'Korean' };

const T = {
  EN: {
    greeting: 'Hello!\nThis is the receipt.\n\n',
    totalAmount: 'Total Amount',
    participants: 'Participants',
    perMember: 'Per Member',
    eachPersonPays: 'Each Person Pays',
    paidBy: 'Paid By',
    thankYou: 'Thank you for your cooperation!',
  },
  KH: {
    greeting: '\u179f\u17bd\u179f\u17d0\u178a\u17b9!\n\u1793\u17c1\u17a0\u1782\u17ba\u200b\u1787\u17b6\u200b\u179c\u17b7\u1780\u17d2\u1799\u1794\u178f\u17d2\u179a\u17cb\u17d4\n\n',
    totalAmount: '\u1785\u17c6\u1793\u1795\u200b\u179f\u179a\u17bb\u1794',
    participants: '\u17a2\u17d2\u1793\u1780\u200b\u1785\u17bc\u179b\u179a\u17bd\u1798',
    perMember: '\u1785\u17c6\u178e\u17b6\u1799\u178f\u17b6\u1798\u17d2\u1793\u17b6\u1780\u17cb',
    eachPersonPays: '\u1780\u17b6\u179a\u178f\u17bc\u178f\u17b6\u178f\u17b6\u1798\u17d2\u1793\u17b6\u1780\u17cb',
    paidBy: '\u1794\u1784\u178a\u17d0\u1799',
    thankYou: '\u17a2\u179a\u1782\u17bb\u178f\u179f\u1798\u17d2\u179a\u17b6\u1794\u1780\u17b7\u1785\u17d2\u1785\u179f\u17a0\u1780\u17b6\u179a\u179a\u1794\u179f\u17cb!',
  },
  KR: {
    greeting: '\uc548\ub155\ud558\uc138\uc694!\n\uc774\uac83\uc740 \uc601\uc218\uc99d\uc785\ub2c8\ub2e4.\n\n',
    totalAmount: '\uc885 \uae08\uc561',
    participants: '\ucc38\uc5ec \uba64\ubc84',
    perMember: '1\uc778\ub2f9 \uae08\uc561',
    eachPersonPays: '\uac01 \uc0ac\ub78c\uc758 \uc9c0\ubd88 \uae08\uc561',
    paidBy: '\uacb0\uc81c\uc790',
    thankYou: '\ud611\uc870\ud574 \uc8fc\uc154\uc11c \uac10\uc0ac\ud569\ub2c8\ub2e4!',
  },
};

function generateInvoice(trips, members, currency, lang, bankName, bankAccount) {
  const t = T[lang] || T.EN;
  const header = (bankName || bankAccount) ? (bankName + '\n' + bankAccount + '\n\n') : '';
  const totalPerMember = {};

  const tripDetails = trips.map((trip) => {
    let memberIds = [];
    try {
      memberIds = typeof trip.mem_id === 'string' ? JSON.parse(trip.mem_id) : (trip.mem_id || []);
    } catch { /* ignore */ }
    const memberNames = memberIds
      .map((id) => members.find((m) => m.id === id)?.mem_name)
      .filter(Boolean);
    const payerName = trip.payer_id
      ? members.find((m) => m.id === Number(trip.payer_id))?.mem_name || '-'
      : '-';
    const count = memberNames.length || 1;
    const perAmount = Number(trip.spend) / count;
    memberNames.forEach((n) => {
      totalPerMember[n] = (totalPerMember[n] || 0) + perAmount;
    });
    return (
      trip.trp_name + '\n' +
      t.totalAmount + ': ' + currency + Number(trip.spend).toLocaleString() + '\n' +
      t.paidBy + ': ' + payerName + '\n' +
      t.participants + ': ' + (memberNames.join(', ') || '-') + '\n' +
      t.perMember + ': ' + currency + perAmount.toFixed(2) + '\n\n'
    );
  }).join('');

  const totalSpend = trips.reduce((s, trip) => s + Number(trip.spend), 0);
  let summary = '';
  if (trips.length > 1) {
    const detail = Object.entries(totalPerMember)
      .map(([n, a]) => n + ': ' + currency + a.toFixed(2))
      .join('\n');
    summary =
      t.totalAmount + ': ' + currency + totalSpend.toLocaleString() + '\n' +
      t.eachPersonPays + ':\n' + detail + '\n\n';
  }
  return header + t.greeting + tripDetails + summary + t.thankYou;
}

export function ShareModal({ open, onClose, group, members = [], trips = [], currency = '$' }) {
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [lang, setLang] = useState('EN');
  const [selectedIds, setSelectedIds] = useState([]);
  const [invoiceText, setInvoiceText] = useState('');
  const [editText, setEditText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load bank details from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBankName(localStorage.getItem('bankName') || '');
      setBankAccount(localStorage.getItem('bankAccount') || '');
    }
  }, []);

  // When dialog opens, select all trips by default
  useEffect(() => {
    if (open) setSelectedIds(trips.map((t) => t.id));
  }, [open, trips]);

  // Rebuild invoice whenever inputs change
  const rebuild = useCallback(() => {
    const selected = trips.filter((t) => selectedIds.includes(t.id));
    const text = generateInvoice(selected, members, currency, lang, bankName, bankAccount);
    setInvoiceText(text);
    if (!isEditing) setEditText(text);
  }, [trips, selectedIds, members, currency, lang, bankName, bankAccount, isEditing]);

  useEffect(() => { rebuild(); }, [rebuild]);

  const handleBankName = (v) => {
    setBankName(v);
    localStorage.setItem('bankName', v);
  };
  const handleBankAccount = (v) => {
    setBankAccount(v);
    localStorage.setItem('bankAccount', v);
  };

  const toggleTrip = (id) =>
    setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(isEditing ? editText : invoiceText);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  const handleEditToggle = () => {
    if (isEditing) setInvoiceText(editText);
    setIsEditing((p) => !p);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Invoice
          </SheetTitle>
          <SheetDescription>
            Generate and share expense invoice with group members
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
          <div className="px-6 py-4 space-y-6 pb-24">
            {/* Bank details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Bank Name</Label>
                <Input
                  placeholder="e.g. KBank"
                  value={bankName}
                  onChange={(e) => handleBankName(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Account No.</Label>
                <Input
                  placeholder="123-456-789"
                  value={bankAccount}
                  onChange={(e) => handleBankAccount(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Language selector */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" /> Language
              </Label>
              <div className="flex gap-2">
                {Object.keys(LANG_LABELS).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${lang === l
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Trip selector */}
            {trips.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  Trips ({selectedIds.length}/{trips.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {trips.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTrip(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedIds.includes(t.id)
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-muted border border-border/30 text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                      {t.trp_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invoice preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Invoice Preview</Label>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium hover:opacity-80 transition-opacity"
                >
                  {isEditing ? (
                    <><Save className="h-3 w-3" /> Save</>
                  ) : (
                    <><Edit2 className="h-3 w-3" /> Edit</>
                  )}
                </button>
              </div>
              <div className="relative rounded-lg border border-border/30 bg-muted/20 overflow-hidden">
                <Textarea
                  value={isEditing ? editText : invoiceText}
                  onChange={(e) => setEditText(e.target.value)}
                  readOnly={!isEditing}
                  rows={8}
                  className="font-mono text-xs leading-relaxed resize-none bg-transparent border-none rounded-none p-3 focus:ring-0"
                />
              </div>
            </div>

            {/* Share link */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-xs h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success('Link copied!');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-background flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <><Check className="mr-2 h-4 w-4" /> Copied!</>
            ) : (
              <><Copy className="mr-2 h-4 w-4" /> Copy Invoice</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>

  );
}
