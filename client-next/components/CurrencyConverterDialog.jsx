'use client';

import { useState } from 'react';
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
import { ArrowRightLeft } from 'lucide-react';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { cn } from '@/lib/utils';

// Exchange rates (you can fetch these from an API in production)
const EXCHANGE_RATES = {
  THB: 1,
  USD: 0.028,
  EUR: 0.026,
  GBP: 0.022,
  JPY: 4.2,
  CNY: 0.2,
  KRW: 37.5,
};

export function CurrencyConverterDialog({ open, onOpenChange, onConvert }) {
  const { isMobile } = useWindowDimensions();
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('THB');
  const [result, setResult] = useState(null);
  
  const handleConvert = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return;
    
    // Convert to THB first, then to target currency
    const inTHB = amountNum / EXCHANGE_RATES[fromCurrency];
    const converted = inTHB * EXCHANGE_RATES[toCurrency];
    
    setResult(converted.toFixed(2));
  };
  
  const handleApply = () => {
    if (result && onConvert) {
      onConvert(result, toCurrency);
    }
    onOpenChange(false);
  };
  
  const currencies = Object.keys(EXCHANGE_RATES);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-4"
        style={{
          zIndex: 1600,
          maxWidth: isMobile ? '90%' : '500px',
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Currency Converter
          </DialogTitle>
          <DialogDescription>
            Convert between different currencies
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromCurrency">From</Label>
              <select
                id="fromCurrency"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="toCurrency">To</Label>
              <select
                id="toCurrency"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <Button
            onClick={handleConvert}
            className="w-full"
            disabled={!amount}
          >
            Convert
          </Button>
          
          {result && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Result</p>
              <p className="text-2xl font-bold">
                {result} {toCurrency}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className={cn('gap-2', isMobile && 'flex-col')}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cn(isMobile && 'w-full')}
          >
            Cancel
          </Button>
          {onConvert && (
            <Button
              onClick={handleApply}
              disabled={!result}
              className={cn(isMobile && 'w-full')}
            >
              Apply
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
