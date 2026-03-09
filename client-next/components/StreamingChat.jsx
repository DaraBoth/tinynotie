'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send, Loader2, Sparkles, Paperclip, X,
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

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 8;
const TEXT_MIME_PREFIXES = ['text/'];
const TEXT_MIME_EXACT = [
    'application/json',
    'application/xml',
    'application/javascript',
    'application/x-javascript',
    'application/x-yaml',
    'application/yaml',
];

const isTextLikeFile = (file) => {
    const mime = String(file?.type || '').toLowerCase();
    if (TEXT_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))) return true;
    if (TEXT_MIME_EXACT.includes(mime)) return true;

    const name = String(file?.name || '').toLowerCase();
    return /\.(txt|md|csv|log|json|xml|yaml|yml|js|jsx|ts|tsx|css|html|sql|py|java|go|rs)$/i.test(name);
};

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file as data URL'));
    reader.readAsDataURL(file);
});

const readFileAsText = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file as text'));
    reader.readAsText(file);
});

const shouldRefreshFromTool = (toolName) => {
    const name = String(toolName || '').toLowerCase();
    return [
        'add_member',
        'update_member',
        'add_trip',
        'update_trip',
        'bulk_update_members_info',
        'set_all_members_paid',
        'bulk_update_trips_info',
    ].includes(name);
};

const TOOL_DISPLAY_NAMES = {
    get_group_data: 'Read Group Data',
    add_member: 'Add Member',
    update_member: 'Update Member',
    set_all_members_paid: 'Set All Member Payments',
    bulk_update_members_info: 'Bulk Update Members',
    add_trip: 'Add Trip',
    update_trip: 'Update Trip',
    bulk_update_trips_info: 'Bulk Update Trips',
};

const getToolDisplayName = (toolName) => {
    const key = String(toolName || '').toLowerCase();
    return TOOL_DISPLAY_NAMES[key] || 'Execute Action';
};

export function StreamingChat({ open, onClose, groupId, onDataChanged }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'Thinking...', 'Executing tools...', etc.
    const [activeTools, setActiveTools] = useState([]); // List of current tool calls
    const [attachments, setAttachments] = useState([]);

    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    const defaultWelcomeMessage = {
        role: 'assistant',
        content: 'Hello! I am your AI financial assistant. I can help you manage trips, members, and analyze spending patterns. How can I help you today?',
        timestamp: new Date(),
    };

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

    useEffect(() => {
        if (!open || !groupId) return;

        const loadHistory = async () => {
            try {
                const token = (() => {
                    try {
                        const auth = JSON.parse(localStorage.getItem('auth-storage'));
                        return auth?.state?.token;
                    } catch {
                        return null;
                    }
                })();

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/openai/chat/history?groupId=${groupId}`,
                    {
                        headers: {
                            'Authorization': token ? `Bearer ${token}` : '',
                        },
                    }
                );

                if (!response.ok) {
                    setMessages([defaultWelcomeMessage]);
                    return;
                }

                const payload = await response.json();
                const history = Array.isArray(payload?.data) ? payload.data : [];
                if (history.length === 0) {
                    setMessages([defaultWelcomeMessage]);
                    return;
                }

                setMessages(history.map((item) => ({
                    role: item.role,
                    content: item.content,
                    timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
                })));
            } catch {
                setMessages([defaultWelcomeMessage]);
            }
        };

        loadHistory();
    }, [open, groupId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!input.trim() && attachments.length === 0) || isLoading) return;
        if (!groupId) {
            toast.error('Group context missing. Please reopen the group page.');
            return;
        }

        const textContent = input.trim();
        const attachmentLabel = attachments.length
            ? attachments.map((f) => `[File: ${f.name}]`).join('\n')
            : '';

        const displayContent = attachmentLabel
            ? `${textContent}${textContent ? '\n\n' : ''}${attachmentLabel}`
            : textContent;

        const userMessage = {
            role: 'user',
            content: displayContent,
            timestamp: new Date(),
            attachmentName: attachments.length ? attachments.map((f) => f.name).join(', ') : null,
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = textContent;
        const currentAttachments = attachments;
        setInput('');
        setAttachments([]);
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
                    history,
                    imageAttachment: null,
                    attachments: currentAttachments,
                })
            });

            if (!response.ok) throw new Error('Failed to connect to AI');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let aiResponseContent = '';
            let hasMutatingToolChanges = false;
            let currentAiMessage = {
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                tools: []
            };

            setMessages(prev => [...prev, currentAiMessage]);

            let buffered = '';
            let doneReceived = false;

            const processEventBlock = (block) => {
                const eventLine = block.split('\n').find((line) => line.startsWith('event: '));
                const dataLine = block.split('\n').find((line) => line.startsWith('data: '));
                if (!eventLine || !dataLine) return;

                const event = eventLine.slice(7).trim();
                let data;

                try {
                    data = JSON.parse(dataLine.slice(6));
                } catch {
                    return;
                }

                if (event === 'message') {
                    aiResponseContent += data.delta || '';
                    setMessages(prev => {
                        const last = [...prev];
                        if (last[last.length - 1]) {
                            last[last.length - 1].content = aiResponseContent;
                        }
                        return last;
                    });
                    setStatus(null);
                    return;
                }

                if (event === 'status') {
                    setStatus(data.message || null);
                    return;
                }

                if (event === 'tool_result') {
                    if (shouldRefreshFromTool(data.tool)) {
                        hasMutatingToolChanges = true;
                    }

                    setMessages(prev => {
                        const last = [...prev];
                        const currentMsg = last[last.length - 1];
                        if (!currentMsg) return last;

                        currentMsg.tools = [
                            ...(currentMsg.tools || []),
                            { name: data.tool, result: data.result }
                        ];
                        return last;
                    });
                    return;
                }

                if (event === 'error') {
                    toast.error(data.message || 'Streaming error');
                    return;
                }

                if (event === 'done') {
                    doneReceived = true;
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (buffered.trim()) {
                        processEventBlock(buffered.trim());
                        buffered = '';
                    }
                    break;
                }

                buffered += decoder.decode(value, { stream: true });
                const events = buffered.split('\n\n');
                buffered = events.pop() || '';

                for (const block of events) {
                    processEventBlock(block);
                }

                if (doneReceived) break;
            }

            if (!aiResponseContent && currentAiMessage.tools?.length) {
                const preview = currentAiMessage.tools
                    .slice(-3)
                    .map((t, idx) => {
                        const summary = t?.result?.summary || t?.result?.message || t?.result?.error || 'Completed';
                        return `${idx + 1}. ${t.name}: ${String(summary)}`;
                    })
                    .join('\n');

                const fallbackText = [
                    'I completed tool operations but did not receive a final model message.',
                    'Latest updates:',
                    preview,
                ].join('\n');

                setMessages(prev => {
                    const last = [...prev];
                    if (last[last.length - 1]) {
                        last[last.length - 1].content = fallbackText;
                    }
                    return last;
                });
            }

            if (hasMutatingToolChanges && typeof onDataChanged === 'function') {
                onDataChanged();
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
                className="!inset-0 !left-0 !right-0 !top-0 !bottom-0 !h-screen !w-screen !max-w-none !rounded-none !border-0 flex flex-col p-0 bg-background/95 backdrop-blur-xl"
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

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                                const fileList = Array.from(e.target.files || []);
                                e.target.value = '';
                                if (!fileList.length) return;

                                setStatus('Reading attachments...');

                                try {
                                    const built = [];
                                    for (const file of fileList) {
                                        if (file.size > MAX_ATTACHMENT_BYTES) {
                                            toast.error(`${file.name} is too large. Max 8MB per file.`);
                                            continue;
                                        }

                                        if (file.type.startsWith('image/')) {
                                            const result = await readFileAsDataURL(file);
                                            const base64 = result.includes(',') ? result.split(',')[1] : '';
                                            if (!base64) continue;
                                            built.push({
                                                name: file.name,
                                                mimeType: file.type || 'image/png',
                                                size: file.size,
                                                kind: 'image',
                                                base64,
                                            });
                                            continue;
                                        }

                                        if (isTextLikeFile(file)) {
                                            const text = await readFileAsText(file);
                                            const truncated = text.length > 120000;
                                            built.push({
                                                name: file.name,
                                                mimeType: file.type || 'text/plain',
                                                size: file.size,
                                                kind: 'text',
                                                textContent: truncated ? text.slice(0, 120000) : text,
                                                truncated,
                                            });
                                            continue;
                                        }

                                        const result = await readFileAsDataURL(file);
                                        const base64 = result.includes(',') ? result.split(',')[1] : '';
                                        built.push({
                                            name: file.name,
                                            mimeType: file.type || 'application/octet-stream',
                                            size: file.size,
                                            kind: 'binary',
                                            base64Preview: base64.slice(0, 2000),
                                        });
                                    }

                                    setAttachments((prev) => [...prev, ...built].slice(0, MAX_ATTACHMENTS));
                                } catch {
                                    toast.error('Failed to process one or more files.');
                                } finally {
                                    setStatus(null);
                                }
                            }}
                        />

                        {attachments.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
                                {attachments.map((file, idx) => (
                                    <div key={`${file.name}-${idx}`} className="flex items-center gap-2 rounded-lg border border-primary/20 bg-background/40 px-2 py-1 max-w-full">
                                        <span className="truncate max-w-[220px]">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                                            className="inline-flex items-center justify-center rounded-md p-0.5 hover:bg-background/40"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2 items-end">
                            <div className="relative flex-1">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onPaste={async (e) => {
                                        const items = Array.from(e.clipboardData?.items || []);
                                        const files = items
                                            .filter((item) => item.kind === 'file')
                                            .map((item) => item.getAsFile())
                                            .filter(Boolean);

                                        if (!files.length) return;
                                        e.preventDefault();

                                        setStatus('Reading pasted files...');
                                        try {
                                            const built = [];
                                            for (const file of files) {
                                                if (file.size > MAX_ATTACHMENT_BYTES) {
                                                    toast.error(`${file.name} is too large. Max 8MB per file.`);
                                                    continue;
                                                }

                                                if (file.type.startsWith('image/')) {
                                                    const result = await readFileAsDataURL(file);
                                                    const base64 = result.includes(',') ? result.split(',')[1] : '';
                                                    if (!base64) continue;
                                                    built.push({
                                                        name: file.name,
                                                        mimeType: file.type || 'image/png',
                                                        size: file.size,
                                                        kind: 'image',
                                                        base64,
                                                    });
                                                    continue;
                                                }

                                                if (isTextLikeFile(file)) {
                                                    const text = await readFileAsText(file);
                                                    const truncated = text.length > 120000;
                                                    built.push({
                                                        name: file.name,
                                                        mimeType: file.type || 'text/plain',
                                                        size: file.size,
                                                        kind: 'text',
                                                        textContent: truncated ? text.slice(0, 120000) : text,
                                                        truncated,
                                                    });
                                                    continue;
                                                }

                                                const result = await readFileAsDataURL(file);
                                                const base64 = result.includes(',') ? result.split(',')[1] : '';
                                                built.push({
                                                    name: file.name,
                                                    mimeType: file.type || 'application/octet-stream',
                                                    size: file.size,
                                                    kind: 'binary',
                                                    base64Preview: base64.slice(0, 2000),
                                                });
                                            }

                                            setAttachments((prev) => [...prev, ...built].slice(0, MAX_ATTACHMENTS));
                                        } catch {
                                            toast.error('Failed to process pasted files.');
                                        } finally {
                                            setStatus(null);
                                        }
                                    }}
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
                                type="button"
                                size="icon"
                                variant="outline"
                                className="rounded-xl h-[52px] w-[52px] shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <Button
                                type="submit"
                                size="icon"
                                className="rounded-xl h-[52px] w-[52px] shadow-lg shadow-primary/20 shrink-0"
                                disabled={(!input.trim() && attachments.length === 0) || isLoading}
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
                                <span>Executed <b>{getToolDisplayName(tool.name)}</b></span>
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
                    ) : isAi && isLast && (
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
