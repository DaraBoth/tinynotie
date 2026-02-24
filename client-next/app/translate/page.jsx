'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SpaceSky } from '@/components/SpaceSky';
import { ArrowLeft, Languages } from 'lucide-react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { toast } from 'sonner';

export default function TranslatePage() {
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('th');
  
  const translateMutation = useMutation({
    mutationFn: (data) => api.translateText(data),
    onSuccess: (response) => {
      setTranslated(response.data.translatedText);
    },
    onError: (error) => {
      toast.error('Translation failed');
    },
  });
  
  const handleTranslate = () => {
    if (!text.trim()) {
      toast.error('Please enter text to translate');
      return;
    }
    
    translateMutation.mutate({
      text,
      sourceLang,
      targetLang,
    });
  };
  
  return (
    <main className="relative min-h-screen p-4">
      <SpaceSky />
      
      <div className="relative z-10 container mx-auto max-w-4xl py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <Card className="backdrop-blur-sm bg-card/90 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Languages className="h-6 w-6" />
              Translator
            </CardTitle>
            <CardDescription>
              Translate text between different languages
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="en">English</option>
                  <option value="th">Thai</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="th">Thai</option>
                  <option value="en">English</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to translate</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text here..."
                rows={6}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            
            <Button
              onClick={handleTranslate}
              disabled={translateMutation.isPending}
              className="w-full"
            >
              {translateMutation.isPending ? 'Translating...' : 'Translate'}
            </Button>
            
            {translated && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Translation</label>
                <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm">{translated}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
