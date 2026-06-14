'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Camera, Upload, X, ScanLine, Plus, Trash2,
  CheckCircle2, ImageIcon, Sparkles, CreditCard,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { createWorker } from 'tesseract.js';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarColor } from '@/app/groups/[groupId]/GroupPageClient';

const NONE_PAYER = '__none__';

/**
 * Compress and resize an image File to at most maxSide×maxSide px at JPEG quality 0.7.
 * Returns the original file unchanged for non-image types (PDF, XLSX, etc.).
 * Camera shots are typically 3000×4000 px / 4–8 MB — this brings them to ~100–200 KB,
 * cutting AI vision tokens from 765+/tile down to the flat 85-token "low detail" rate.
 */
async function compressImage(file, maxSide = 1024, quality = 0.7) {
  if (!file.type?.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

function defaultRow(allMemberIds = []) {
  return {
    id: Date.now() + Math.random(),
    trp_name: '',
    spend: '',
    payer_id: NONE_PAYER,
    joined_ids: allMemberIds
  };
}

export function ReceiptScanner({ open, onClose, groupId, members = [] }) {
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [rows, setRows] = useState([]);
  const [scanned, setScanned] = useState(false);
  // Cooldown flag: prevents duplicate API calls from impatient taps.
  // Resets automatically 3 s after each scan attempt.
  const [scanCooldown, setScanCooldown] = useState(false);
  // True while the Tesseract language packs are downloading / OCR is running.
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const scanMutation = useReceiptScan();
  const addMutation = useAddMultipleTrips(groupId);

  useEffect(() => {
    if (!open) return undefined;

    const onPaste = (event) => {
      const items = Array.from(event.clipboardData?.items || []);
      const fileItem = items.find((item) => item.kind === 'file');
      const pastedFile = fileItem?.getAsFile();
      if (!pastedFile) return;

      event.preventDefault();
      handleFile(pastedFile);
      toast.success(`Pasted: ${pastedFile.name || 'Clipboard image'}`);
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open]);

  const allMemberIds = members.map(m => m.id);

  const handleFile = async (file) => {
    if (!file) return;
    const allowed = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/',
    ];

    const isAllowed = allowed.some((prefix) => file.type?.startsWith(prefix) || file.type === prefix);
    if (!isAllowed) {
      toast.error('Unsupported file type. Use image, PDF, DOC, DOCX, XLS, XLSX, or text file.');
      return;
    }

    // Compress images client-side (max 1024×1024, JPEG q=0.7) before storing.
    // This reduces camera photos from 4–8 MB to ~100–200 KB, slashing AI vision tokens.
    const processedFile = await compressImage(file);
    setImageFile(processedFile);
    setPreview(processedFile.type?.startsWith('image/') ? URL.createObjectURL(processedFile) : '');
    setRows([]);
    setScanned(false);
  };

  /**
   * Tesseract.js offline-OCR fallback.
   * Only called when the AI scan mutation throws (quota, network, 5xx, etc.).
   * Loads eng+kor+khm language packs on first run (~18 MB from jsDelivr CDN, cached).
   * Extracts raw text locally then uploads it as a plain-text file to the existing
   * /openai/receiptImage endpoint, which routes it through the non-image text path.
   * Only runs for image files — PDF/Excel/text already pass through text extraction
   * server-side and do not benefit from client-side OCR.
   */
  const runTesseractFallback = async (file) => {
    if (!file?.type?.startsWith('image/')) {
      throw new Error('Tesseract fallback is only available for image files');
    }

    setOcrLoading(true);
    toast.info('AI unavailable — trying offline OCR (may take a moment)…');

    let worker;
    try {
      // Load eng + kor + khm from the self-hosted /tessdata/ folder
      // (client-next/public/tessdata/*.traineddata.gz) so users never hit CDN.
      // Falls back silently to jsDelivr CDN if the local files are missing.
      worker = await createWorker(['eng', 'kor', 'khm'], 1, {
        langPath: '/tessdata',
      });
      const { data: { text } } = await worker.recognize(file);

      if (!text?.trim()) {
        throw new Error('Tesseract extracted no text from the image');
      }

      // Package the OCR text as a plain-text file and re-use the same server endpoint.
      // The server detects text/plain and routes it through the text extraction path,
      // keeping all response parsing identical to the AI scan path.
      const textBlob = new Blob([text], { type: 'text/plain' });
      const textFile = new File([textBlob], 'ocr-receipt.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('receipt', textFile);

      return await scanMutation.mutateAsync(formData);
    } finally {
      setOcrLoading(false);
      await worker?.terminate();
    }
  };

  /** Shared response parser — used by both AI and Tesseract paths. */
  const applyScannedResponse = (response) => {
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
      joined_ids: allMemberIds,
    })));
    setScanned(true);
    toast.success(`Detected ${trips.length} expense item${trips.length !== 1 ? 's' : ''}`);
  };

  const handleScan = async () => {
    if (!imageFile) { toast.error('Please select or paste a file first'); return; }
    // Debounce: ignore taps within 3 s of the last attempt to prevent duplicate calls.
    if (scanCooldown) { toast.info('Please wait a moment before scanning again.'); return; }

    setScanCooldown(true);
    setTimeout(() => setScanCooldown(false), 3000);

    const formData = new FormData();
    formData.append('receipt', imageFile);
    try {
      const response = await scanMutation.mutateAsync(formData);
      applyScannedResponse(response);
    } catch {
      // AI scan failed — attempt Tesseract offline OCR for image files.
      if (imageFile?.type?.startsWith('image/')) {
        try {
          const fallbackResponse = await runTesseractFallback(imageFile);
          applyScannedResponse(fallbackResponse);
        } catch (ocrErr) {
          toast.error(`Scan failed and offline OCR also failed: ${ocrErr.message}`);
        }
      }
      // Non-image failures are already surfaced by the mutation's own error toast.
    }
  };

  const updateRow = (id, field, value) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const toggleMember = (rowId, memberId) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const joined = r.joined_ids.includes(memberId)
        ? r.joined_ids.filter(id => id !== memberId)
        : [...r.joined_ids, memberId];
      return { ...r, joined_ids: joined };
    }));
  };

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));
  const addRow = () => setRows((prev) => [...prev, defaultRow(allMemberIds)]);

  const handleAddAll = async () => {
    const valid = rows.filter((r) => r.trp_name.trim() && parseFloat(r.spend) > 0);
    if (valid.length === 0) { toast.error('No valid rows to add'); return; }

    // Check if any row has no members selected
    const missingMembers = valid.find(r => r.joined_ids.length === 0);
    if (missingMembers) {
      toast.error(`Please select at least one member for "${missingMembers.trp_name}"`);
      return;
    }

    const trips = valid.map((r) => ({
      trp_name: r.trp_name.trim(),
      spend: parseFloat(r.spend),
      mem_id: JSON.stringify(r.joined_ids), // Use specific members for this row
      payer_id: r.payer_id !== NONE_PAYER ? Number(r.payer_id) : null,
      description: 'From receipt scan',
    }));
    try {
      await addMutation.mutateAsync(trips);
      toast.success(`Added ${valid.length} expense${valid.length !== 1 ? 's' : ''} to group`);
      clearAll();
      onClose();
    } catch { /* handled by mutation */ }
  };

  const clearAll = () => {
    setImageFile(null);
    setPreview('');
    setRows([]);
    setScanned(false);
    setScanCooldown(false);
    setOcrLoading(false);
  };

  const handleClose = () => { clearAll(); onClose(); };

  /* ── step indicator ── */
  const step = !imageFile ? 1 : !scanned ? 2 : 3;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent title="Scan Receipt" description="Use AI to extract expense items from a receipt image">
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
                  <span className="text-xs font-semibold">Upload File</span>
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
                Supported: image, PDF, DOC/DOCX, XLS/XLSX, text — max 10 MB. You can also paste from clipboard.
              </p>

              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.xml,.md" className="hidden"
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
                    {preview ? (
                      <img src={preview} alt="Receipt preview" className="w-full max-h-52 object-contain" />
                    ) : (
                      <div className="w-full min-h-28 px-4 py-6">
                        <p className="text-sm font-semibold truncate">{imageFile?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{imageFile?.type || 'Unknown type'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{Math.round((imageFile?.size || 0) / 1024)} KB</p>
                      </div>
                    )}
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
                    disabled={scanMutation.isPending || ocrLoading || scanCooldown} className="w-full gap-2 h-12 rounded-xl">
                    <Sparkles className="h-4 w-4" />
                    {scanMutation.isPending ? 'AI Analyzing Receipt…'
                      : ocrLoading ? 'Loading OCR engine…'
                      : scanCooldown ? 'Please wait…'
                      : 'Scan with AI'}
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

                    <div className="space-y-3">
                      {rows.map((row, i) => (
                        <div key={row.id}
                          className="p-3 rounded-xl border border-border/30 bg-muted/20 space-y-3">
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
                            placeholder="Item / expense name"
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

                          {/* Member multi-selection */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                <Users className="h-3 w-3" /> Joined By ({row.joined_ids.length})
                              </label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateRow(row.id, 'joined_ids', allMemberIds)}
                                  disabled={row.joined_ids.length === members.length}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateRow(row.id, 'joined_ids', [])}
                                  disabled={row.joined_ids.length === 0}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-border/50 text-muted-foreground bg-muted/30 hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  None
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {members.map(m => {
                                const isSelected = row.joined_ids.includes(m.id);
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => toggleMember(row.id, m.id)}
                                    className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${isSelected
                                        ? 'bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20'
                                        : 'bg-background border-border/50 text-muted-foreground hover:border-border'
                                      }`}
                                  >
                                    <Avatar className="h-4 w-4">
                                      <AvatarFallback className={`${getAvatarColor(m.mem_name)} text-[8px] text-white font-bold`}>
                                        {m.mem_name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[10px] font-medium leading-none">{m.mem_name}</span>
                                    {isSelected && (
                                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary text-white rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-1.5 w-1.5" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
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
