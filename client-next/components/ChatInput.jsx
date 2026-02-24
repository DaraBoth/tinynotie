'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useSendMessage } from '@/hooks/useQueries';

export function ChatInput({
  setMessages,
  messages,
  userId,
  chatContainerRef,
  initialMessage = '',
  handleScrollToBottom,
  setTyping,
}) {
  const [inputMessage, setInputMessage] = useState(initialMessage);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (initialMessage) {
      setInputMessage(initialMessage);
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  const handleSendMessage = async (message = inputMessage) => {
    if (message.trim() === '') return;
    handleScrollToBottom();
    setTyping(true);
    
    setMessages((prevMessages) =>
      Array.isArray(prevMessages)
        ? [...prevMessages, { role: 'user', parts: [{ text: message }] }]
        : [{ role: 'user', parts: [{ text: message }] }]
    );

    const updatedMessages = [
      ...messages,
      { role: 'user', parts: [{ text: message }] },
    ];

    setInputMessage('');

    try {
      const response = await sendMessage.mutateAsync({
        userAskID: userId.toLowerCase(),
        userAsk: message,
        chatHistory: updatedMessages,
      });

      const aiMessage = {
        role: 'model',
        parts: [
          { text: response.message || 'AI could not process the request.' },
        ],
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: 'model',
          parts: [
            {
              text: 'There was an error processing your request. Please try again.',
            },
          ],
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4 p-2 rounded-3xl bg-muted/50 shadow-sm">
      <Input
        type="text"
        placeholder="Type your message..."
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button
        onClick={() => handleSendMessage()}
        disabled={sendMessage.isPending || inputMessage.trim() === ''}
        size="icon"
        className="rounded-full"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
