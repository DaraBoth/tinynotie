'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/api/apiClient';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/time';

export function ChatWithDatabase({ open, onClose, groupId }) {
  const { isMobile } = useWindowDimensions();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I can help you analyze your group expenses. Ask me anything about your spending patterns, member balances, or trip summaries!',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollRef = useRef(null);

  const chatMutation = useMutation({
    mutationFn: async (message) => {
      const response = await api.chatWithDatabase({
        groupId,
        message,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const aiMessage = {
        role: 'assistant',
        content: data.response || data.message || 'I couldn\'t process that request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to get response';
      toast.error(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0 overflow-hidden border-border/20 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-3xl" style={{ zIndex: 1600 }}>
        <div className="relative px-6 pt-10 pb-6 overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 -z-10" />
          <DialogHeader className="p-0">
            <div className="flex items-center gap-5 relative group/header">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover/header:opacity-100 transition-opacity" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] relative overflow-hidden">
                <Bot className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <DialogTitle className="text-4xl font-black tracking-tighter text-foreground uppercase italic leading-[0.8]">
                  AI <br />
                  <span className="text-primary italic-none tracking-normal">Assistant.</span>
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] italic">Group Intelligence</p>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-4 rounded-2xl relative group ${message.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-[0_4px_15px_rgba(var(--primary-rgb),0.2)] ml-12'
                      : 'bg-muted/50 border border-border/30 backdrop-blur-sm mr-12'
                    }`}
                >
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <div className={`flex items-center gap-2 mt-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${message.role === 'user' ? 'text-primary-foreground/50' : 'text-muted-foreground/50'
                      }`}>
                      {formatDateTime(message.timestamp)}
                    </p>
                    {message.role === 'assistant' && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1 border-primary/20 text-primary font-black uppercase italic">Insight</Badge>
                    )}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <Card className="bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </Card>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-6 pt-4 border-t border-border/10 bg-muted/5 active:bg-muted/10 transition-colors">
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-500/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about expenses, balances, or summaries..."
                disabled={chatMutation.isPending}
                className="h-14 relative bg-background border-border/30 rounded-2xl focus:ring-0 px-5 text-sm font-semibold placeholder:text-muted-foreground/30 transition-all"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!inputMessage.trim() || chatMutation.isPending}
              className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-105 transition-all shrink-0"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
