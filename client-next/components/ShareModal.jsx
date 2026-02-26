'use client';

import { useState, useEffect, useCallback } from 'react';
import { Share2, Copy, Check, Edit2, Save, Globe } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  const [bankName,    setBankName]    = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [lang,        setLang]        = useState('EN');
  const [selectedIds, setSelectedIds] = useState([]);
  const [invoiceText, setInvoiceText] = useState('');
  const [editText,    setEditText]    = useState('');
  const [isEditing,   setIsEditing]   = useState(false);
  const [copied,      setCopied]      = useState(false);

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30 sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">Share &amp; Invoice</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Bank details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Bank Name
              </Label>
              <Input
                placeholder="e.g. KBank"
                value={bankName}
                onChange={(e) => handleBankName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Account No.
              </Label>
              <Input
                placeholder="123-456-789"
                value={bankAccount}
                onChange={(e) => handleBankAccount(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Language selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Language
            </Label>
            <div className="flex gap-2">
              {Object.keys(LANG_LABELS).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    lang === l
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/60 border-border/40 hover:bg-muted'
                  }`}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>

          {/* Trip selector */}
          {trips.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Include Trips
              </Label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border/40 bg-muted/20">
                {trips.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTrip(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedIds.includes(t.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/60 border-border/40 hover:bg-muted'
                    }`}
                  >
                    {t.trp_name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedIds.length} of {trips.length} trips selected
              </p>
            </div>
          )}

          {/* Invoice preview / editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Invoice
              </Label>
              <button
                type="button"
                onClick={handleEditToggle}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
              >
                {isEditing ? (
                  <><Save className="h-3 w-3" /> Save</>
                ) : (
                  <><Edit2 className="h-3 w-3" /> Edit</>
                )}
              </button>
            </div>
            <Textarea
              value={isEditing ? editText : invoiceText}
              onChange={(e) => setEditText(e.target.value)}
              readOnly={!isEditing}
              rows={10}
              className="font-mono text-xs resize-none bg-muted/30"
            />
          </div>

          {/* Share link */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Group Link
            </Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1 text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied!');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Copy invoice button */}
          <Button type="button" onClick={handleCopy} className="w-full gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
