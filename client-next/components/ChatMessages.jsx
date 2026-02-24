'use client';

import { Box } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export function ChatMessages({ messages, chatContainerRef, typing }) {
  return (
    <div
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ maxHeight: '60vh', height: '60vh' }}
    >
      {Array.isArray(messages) && messages.length > 0 ? (
        messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-2',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'model' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                🤖
              </div>
            )}
            <div
              className={cn(
                'rounded-2xl px-4 py-3 max-w-[75%] shadow-md',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.parts[0].text}
                </ReactMarkdown>
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                👤
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center text-muted-foreground mt-8">
          No chat yet. Start by typing a message!
        </div>
      )}

      {/* Typing Indicator */}
      {typing && (
        <div className="flex items-center gap-2 bg-muted p-4 rounded-2xl max-w-[75%] shadow-md">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-muted-foreground">AI is typing...</span>
        </div>
      )}
    </div>
  );
}
