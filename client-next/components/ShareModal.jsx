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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-border/20 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-3xl">
        <div className="relative overflow-y-auto max-h-[90dvh]">
          {/* Header with decorative background */}
          <div className="relative px-6 pt-10 pb-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 -z-10" />
            <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[200%] bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)] -z-10" />

            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-105 transition-transform">
                  <Share2 className="h-7 w-7 text-primary animate-pulse" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tighter text-foreground uppercase italic leading-none">
                    Share <br />
                    <span className="text-primary italic-none">Invoice.</span>
                  </DialogTitle>
                  <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.2em] italic mt-1">Generate tactical summaries.</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 pb-8 space-y-8">
            {/* Bank details - Refined */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 px-1">
                  Bank Name
                </Label>
                <Input
                  placeholder="e.g. KBank"
                  value={bankName}
                  onChange={(e) => handleBankName(e.target.value)}
                  className="h-11 bg-muted/20 border-border/30 rounded-xl focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 px-1">
                  Account No.
                </Label>
                <Input
                  placeholder="123-456-789"
                  value={bankAccount}
                  onChange={(e) => handleBankAccount(e.target.value)}
                  className="h-11 bg-muted/20 border-border/30 rounded-xl focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            {/* Language selector - Modern Pills */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 flex items-center gap-2 px-1">
                <Globe className="h-3 w-3 text-primary" /> Language Mode
              </Label>
              <div className="flex gap-2 p-2 bg-secondary/20 border border-primary/10 rounded-2xl">
                {Object.keys(LANG_LABELS).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-[0.2em] ${lang === l
                      ? 'bg-background text-primary shadow-xl border border-primary/20 scale-[1.02]'
                      : 'text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5'
                      }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Trip selector - Clean list */}
            {trips.length > 0 && (
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 px-1">
                  Select Trips ({selectedIds.length}/{trips.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {trips.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTrip(t.id)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${selectedIds.includes(t.id)
                        ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                        : 'bg-muted/10 border-border/30 text-muted-foreground hover:border-border/60'
                        }`}
                    >
                      {t.trp_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invoice preview / editor - Code Block Style */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
                  Digital Invoice
                </Label>
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                >
                  {isEditing ? (
                    <><Save className="h-3 w-3" /> Save Changes</>
                  ) : (
                    <><Edit2 className="h-3 w-3" /> Manual Edit</>
                  )}
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl -z-10 group-hover:opacity-100 opacity-0 transition-opacity" />
                <Textarea
                  value={isEditing ? editText : invoiceText}
                  onChange={(e) => setEditText(e.target.value)}
                  readOnly={!isEditing}
                  rows={10}
                  className="font-mono text-[11px] leading-relaxed resize-none bg-muted/40 border-border/30 rounded-2xl p-5 focus:ring-0 focus:border-border/50 custom-scrollbar"
                />
              </div>
            </div>

            {/* External Links & Actions */}
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Direct Link</span>
                    <span className="text-xs font-medium truncate opacity-80">{shareUrl}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl shrink-0 hover:bg-background/50"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success('Link copied!');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={handleCopy}
                  className="w-full h-14 rounded-2xl gap-3 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  );
}
