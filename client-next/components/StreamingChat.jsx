'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send, Loader2, Sparkles,
    Database, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function StreamingChat({ open, onClose, groupId }) {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I am your AI financial assistant. I can help you manage trips, members, and analyze spending patterns. How can I help you today?',
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'Thinking...', 'Executing tools...', etc.
    const [activeTools, setActiveTools] = useState([]); // List of current tool calls

    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, status, activeTools]);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        if (!groupId) {
            toast.error('Group context missing. Please reopen the group page.');
            return;
        }

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setStatus('Thinking...');

        try {
            // Prepare history for API (last 10 messages)
            const history = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/openai/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(() => {
                        try {
                            const auth = JSON.parse(localStorage.getItem('auth-storage'));
                            return auth?.state?.token;
                        } catch (e) {
                            return null;
                        }
                    })()}`
                },
                body: JSON.stringify({
                    message: currentInput,
                    groupId,
                    history
                })
            });

            if (!response.ok) throw new Error('Failed to connect to AI');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let aiResponseContent = '';
            let currentAiMessage = {
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                tools: []
            };

            setMessages(prev => [...prev, currentAiMessage]);

            let buffered = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffered += decoder.decode(value, { stream: true });
                const events = buffered.split('\n\n');
                buffered = events.pop() || '';

                for (const block of events) {
                    const eventLine = block.split('\n').find((line) => line.startsWith('event: '));
                    const dataLine = block.split('\n').find((line) => line.startsWith('data: '));
                    if (!eventLine || !dataLine) continue;

                    const event = eventLine.slice(7).trim();
                    let data;

                    try {
                        data = JSON.parse(dataLine.slice(6));
                    } catch {
                        continue;
                    }

                    if (event === 'message') {
                        aiResponseContent += data.delta || '';
                        setMessages(prev => {
                            const last = [...prev];
                            last[last.length - 1].content = aiResponseContent;
                            return last;
                        });
                        setStatus(null);
                    } else if (event === 'status') {
                        setStatus(data.message || null);
                    } else if (event === 'tool_result') {
                        setMessages(prev => {
                            const last = [...prev];
                            const currentMsg = last[last.length - 1];
                            currentMsg.tools = [...(currentMsg.tools || []), {
                                name: data.tool,
                                result: data.result
                            }];
                            return last;
                        });
                    } else if (event === 'error') {
                        toast.error(data.message || 'Streaming error');
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('AI is currently unavailable. Please try again later.');
        } finally {
            setIsLoading(false);
            setStatus(null);
        }
    };

    return (
        <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <SheetContent
                className="flex flex-col p-0 bg-background/95 backdrop-blur-xl border-l border-border/40 sm:max-w-xl"
                title="AI Financial Assistant"
                description="Streamlined AI assistant for managing group expenses"
            >
                <SheetHeader className="bg-background/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                AI Assistant
                            </SheetTitle>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                Premium Financial Agent
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <SheetBody className="flex-1 overflow-hidden flex flex-col p-0">
                    <ScrollArea className="flex-1 px-4 py-6">
                        <div className="space-y-6 max-w-full overflow-hidden">
                            {messages.map((msg, i) => (
                                <MessageBubble key={i} message={msg} isLast={i === messages.length - 1} />
                            ))}

                            <AnimatePresence>
                                {status && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-2xl border border-border/20 w-full"
                                    >
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                        <span className="font-medium italic">{status}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div ref={scrollRef} className="h-4" />
                        </div>
                    </ScrollArea>
                </SheetBody>

                <div className="p-4 sm:p-6 border-t border-border/30 bg-background/50 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="relative group">
                        <div className="absolute inset-x-0 -top-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />

                        <div className="flex gap-2 items-end">
                            <div className="relative flex-1">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about expenses, add trips, or manage members..."
                                    className="pr-12 py-6 rounded-2xl border-border/40 bg-muted/20 focus-visible:ring-primary/30 transition-all"
                                    disabled={isLoading}
                                />
                                <div className="absolute right-3 bottom-2.5">
                                    <span className="text-[10px] text-muted-foreground font-medium opacity-50">
                                        ⌘ + Enter
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                size="icon"
                                className="rounded-xl h-[52px] w-[52px] shadow-lg shadow-primary/20 shrink-0"
                                disabled={!input.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                        <p className="mt-2.5 text-[10px] text-center text-muted-foreground/60 transition-opacity">
                            AI can modify data. Please verify important changes.
                        </p>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function MessageBubble({ message, isLast }) {
    const isAi = message.role === 'assistant';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "w-full overflow-hidden"
            )}
        >
            <div className={cn(
                "flex flex-col gap-2 w-full",
                !isAi && "items-end"
            )}>
                {/* Tool thoughts */}
                {isAi && message.tools && message.tools.length > 0 && (
                    <div className="flex flex-col gap-1.5 mb-1 w-full">
                        {message.tools.map((tool, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/20 text-xs text-muted-foreground">
                                <Database className="h-3 w-3 text-primary/60" />
                                <span>Executed <b>{tool.name}</b></span>
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </div>
                        ))}
                    </div>
                )}

                <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed w-full",
                    isAi
                        ? "bg-background border border-border/40 shadow-sm"
                        : "bg-primary/10 border border-primary/20 text-foreground"
                )}>
                    {message.content ? (
                        <div className={cn(
                            "prose prose-sm dark:prose-invert max-w-none break-words",
                            !isAi && "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground"
                        )}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ className, children, ...props }) {
                                        const inline = !className;
                                        if (inline) {
                                            return (
                                                <code className="rounded bg-muted/60 px-1.5 py-0.5 text-[0.85em]" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                        return (
                                            <code className={cn("block rounded-lg bg-muted/60 p-3 overflow-x-auto text-xs", className)} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre({ children }) {
                                        return <pre className="my-3 overflow-x-auto">{children}</pre>;
                                    },
                                    a({ children, ...props }) {
                                        return (
                                            <a className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" {...props}>
                                                {children}
                                            </a>
                                        );
                                    }
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    ) : isLast && (
                        <div className="flex gap-1 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    )}
                </div>

                <span className={cn(
                    "text-[10px] text-muted-foreground px-1 opacity-60",
                    isAi ? "self-start" : "self-end"
                )}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </motion.div>
    );
}
