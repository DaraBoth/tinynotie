'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, ScanLine, Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useReceiptScan, useAddMultipleTrips } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE_PAYER = '__none__';

function defaultRow() {
  return { id: Date.now() + Math.random(), trp_name: '', spend: '', payer_id: NONE_PAYER };
}

export function ReceiptScanner({ groupId, members = [] }) {
  const [expanded,   setExpanded]   = useState(false);
  const [imageFile,  setImageFile]  = useState(null);
  const [preview,    setPreview]    = useState('');
  const [rows,       setRows]       = useState([]);
  const [scanned,    setScanned]    = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const scanMutation     = useReceiptScan();
  const addMutation      = useAddMultipleTrips(groupId);

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
    formData.append('image', imageFile);
    try {
      const response = await scanMutation.mutateAsync(formData);
      const data = response?.data ?? response;
      const trips = Array.isArray(data?.trips) ? data.trips
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data) ? data
        : [];
      if (trips.length === 0) {
        toast.error('No trips detected in the receipt');
        return;
      }
      setRows(
        trips.map((t) => ({
          id: Date.now() + Math.random(),
          trp_name: t.trp_name || t.name || '',
          spend: String(t.spend || t.amount || ''),
          payer_id: NONE_PAYER,
        }))
      );
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
      setRows([]);
      setImageFile(null);
      setPreview('');
      setScanned(false);
    } catch { /* handled by mutation */ }
  };

  const clearImage = () => {
    setImageFile(null);
    setPreview('');
    setRows([]);
    setScanned(false);
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-muted/20 overflow-hidden">
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Scan Receipt with AI</span>
          {scanned && rows.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {rows.length} item{rows.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-4">
          {/* Image upload area */}
          {!preview ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-20 flex-col gap-1 border-dashed text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5" />
                <span className="text-xs">Upload Image</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-20 flex-col gap-1 border-dashed text-muted-foreground hover:text-foreground"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-5 w-5" />
                <span className="text-xs">Take Photo</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="relative">
              <img src={preview} alt="Receipt" className="w-full max-h-48 object-contain rounded-xl border border-border/40 bg-muted/30" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Scan button */}
          {imageFile && !scanned && (
            <Button
              type="button"
              onClick={handleScan}
              disabled={scanMutation.isPending}
              className="w-full gap-2"
            >
              <ScanLine className="h-4 w-4" />
              {scanMutation.isPending ? 'AI Analyzing...' : 'Scan Receipt'}
            </Button>
          )}

          {/* Editable rows */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_120px_32px] gap-1.5 px-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Item Name</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Amount</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Paid By</span>
                <span />
              </div>
              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[1fr_80px_120px_32px] gap-1.5 items-center">
                  <Input
                    value={row.trp_name}
                    onChange={(e) => updateRow(row.id, 'trp_name', e.target.value)}
                    placeholder="Item name"
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.spend}
                    onChange={(e) => updateRow(row.id, 'spend', e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-sm"
                  />
                  <Select value={row.payer_id} onValueChange={(v) => updateRow(row.id, 'payer_id', v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Payer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_PAYER}>None</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.mem_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="w-8 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Add row + Add all */}
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddAll}
                  disabled={addMutation.isPending}
                  className="flex-1 gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {addMutation.isPending ? 'Adding...' : `Add All (${rows.length}) to Group`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
