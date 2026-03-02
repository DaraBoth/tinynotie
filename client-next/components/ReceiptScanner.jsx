'use client';

import { useState, useRef } from 'react';
import {
  Camera, Upload, X, ScanLine, Plus, Trash2,
  CheckCircle2, ImageIcon, Sparkles, CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReceiptScan, useAddMultipleTrips } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetBody,
} from '@/components/ui/sheet';

const NONE_PAYER = '__none__';

function defaultRow() {
  return { id: Date.now() + Math.random(), trp_name: '', spend: '', payer_id: NONE_PAYER };
}

export function ReceiptScanner({ open, onClose, groupId, members = [] }) {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [rows, setRows] = useState([]);
  const [scanned, setScanned] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const scanMutation = useReceiptScan();
  const addMutation = useAddMultipleTrips(groupId);

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setRows([]);
    setScanned(false);
  };

  const handleScan = async () => {
    if (!imageFile) { toast.error('Please select an image first'); return; }
    const formData = new FormData();
    formData.append('receipt', imageFile);
    try {
      const response = await scanMutation.mutateAsync(formData);
      const raw = response?.data ?? response;

      let parsed = raw;
      if (typeof raw?.text === 'string') {
        try {
          const clean = raw.text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          parsed = JSON.parse(clean);
        } catch { parsed = raw; }
      }

      const trips = Array.isArray(parsed?.data) ? parsed.data
        : Array.isArray(parsed?.trips) ? parsed.trips
          : Array.isArray(parsed) ? parsed
            : [];

      if (trips.length === 0) { toast.error('No items detected in the receipt'); return; }

      setRows(trips.map((t) => ({
        id: Date.now() + Math.random(),
        trp_name: t.trp_name || t.name || '',
        spend: String(t.spend || t.amount || ''),
        payer_id: NONE_PAYER,
      })));
      setScanned(true);
      toast.success(`Detected ${trips.length} item${trips.length !== 1 ? 's' : ''}`);
    } catch { /* handled by mutation */ }
  };

  const updateRow = (id, field, value) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));
  const addRow = () => setRows((prev) => [...prev, defaultRow()]);

  const handleAddAll = async () => {
    const valid = rows.filter((r) => r.trp_name.trim() && parseFloat(r.spend) > 0);
    if (valid.length === 0) { toast.error('No valid rows to add'); return; }
    const trips = valid.map((r) => ({
      trp_name: r.trp_name.trim(),
      spend: parseFloat(r.spend),
      mem_id: JSON.stringify(members.map((m) => m.id)),
      payer_id: r.payer_id !== NONE_PAYER ? Number(r.payer_id) : null,
      description: 'From receipt scan',
    }));
    try {
      await addMutation.mutateAsync(trips);
      toast.success(`Added ${valid.length} trip${valid.length !== 1 ? 's' : ''} to group`);
      clearAll();
      onClose();
    } catch { /* handled by mutation */ }
  };

  const clearAll = () => {
    setImageFile(null);
    setPreview('');
    setRows([]);
    setScanned(false);
  };

  const handleClose = () => { clearAll(); onClose(); };

  /* ── step indicator ── */
  const step = !imageFile ? 1 : !scanned ? 2 : 3;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent title="Scan Receipt" description="Use AI to extract trip items from a receipt image">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <ScanLine className="h-5 w-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle>Scan Receipt</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">AI-powered receipt scanner</p>
            </div>
            {/* Step pills */}
            <div className="flex gap-1 shrink-0">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`w-2 h-2 rounded-full transition-colors ${step >= s ? 'bg-violet-400' : 'bg-muted-foreground/20'
                  }`} />
              ))}
            </div>
          </div>
        </SheetHeader>

        <SheetBody>
          {/* ── STEP 1: Upload ── */}
          {!preview ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Step 1 — Choose Image
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 h-32 rounded-2xl border-2 border-dashed border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold">Upload Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 h-32 rounded-2xl border-2 border-dashed border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold">Take Photo</span>
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                Supported: JPG, PNG, WEBP — max 10 MB
              </p>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          ) : (
            <>
              {/* ── STEP 2: Preview & Scan ── */}
              <div className="space-y-4">
                {/* Image preview */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {scanned ? 'Step 3 — Review & Edit' : 'Step 2 — Confirm & Scan'}
                  </p>
                  <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-muted/20">
                    <img src={preview} alt="Receipt preview"
                      className="w-full max-h-52 object-contain" />
                    <button
                      type="button"
                      onClick={clearAll}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 border border-border/40 flex items-center justify-center hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    {scanned && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-violet-500/90 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                        <span className="text-[11px] text-white font-semibold">{rows.length} items found</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scan button */}
                {!scanned && (
                  <Button type="button" onClick={handleScan}
                    disabled={scanMutation.isPending} className="w-full gap-2 h-12 rounded-xl">
                    <Sparkles className="h-4 w-4" />
                    {scanMutation.isPending ? 'AI Analyzing Receipt…' : 'Scan with AI'}
                  </Button>
                )}

                {/* ── STEP 3: Editable rows ── */}
                {rows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" /> Detected Items
                      </Label>
                      <button type="button" onClick={addRow}
                        className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                        <Plus className="h-3.5 w-3.5" /> Add row
                      </button>
                    </div>

                    <div className="space-y-2">
                      {rows.map((row, i) => (
                        <div key={row.id}
                          className="p-3 rounded-xl border border-border/30 bg-muted/20 space-y-2">
                          {/* Row number + delete */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Item {i + 1}
                            </span>
                            <button type="button" onClick={() => removeRow(row.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Input
                            value={row.trp_name}
                            onChange={(e) => updateRow(row.id, 'trp_name', e.target.value)}
                            placeholder="Item / trip name"
                            className="h-9 text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number" min="0" step="0.01"
                              value={row.spend}
                              onChange={(e) => updateRow(row.id, 'spend', e.target.value)}
                              placeholder="Amount"
                              className="h-9 text-sm"
                            />
                            <Select value={row.payer_id}
                              onValueChange={(v) => updateRow(row.id, 'payer_id', v)}>
                              <SelectTrigger className="h-9 text-xs">
                                <CreditCard className="h-3 w-3 mr-1.5 shrink-0 text-muted-foreground" />
                                <SelectValue placeholder="Payer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NONE_PAYER}>— None —</SelectItem>
                                {members.map((m) => (
                                  <SelectItem key={m.id} value={String(m.id)}>{m.mem_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetBody>

        {/* Footer */}
        {rows.length > 0 && (
          <SheetFooter>
            <Button type="button" variant="ghost" onClick={handleClose} className="flex-1"
              disabled={addMutation.isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddAll}
              disabled={addMutation.isPending} className="flex-1 gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {addMutation.isPending ? 'Adding…' : `Add ${rows.length} to Group`}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
