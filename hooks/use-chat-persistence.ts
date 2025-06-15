import { useState, useEffect, useCallback } from 'react';

export interface ChatSession {
  problemId: string;
  title: string;
  lastUpdated: Date;
  preview: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  type: "message" | "feedback" | "hint" | "step" | "question" | "celebration";
  timestamp: Date;
  canSpeak?: boolean;
  isStreaming?: boolean;
  metadata?: {
    stepNumber?: number;
    isCorrect?: boolean;
    attempts?: number;
    showControls?: boolean;
  };
}

interface StoredChatMessage extends Omit<ChatMessage, 'timestamp'> {
  timestamp: string;
}

export function useChatPersistence(problemId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load messages from localStorage when component mounts
  useEffect(() => {
    try {
      const savedChat = localStorage.getItem(`chat_${problemId}`);
      if (savedChat) {
        const parsedMessages: StoredChatMessage[] = JSON.parse(savedChat);
        // Convert string timestamps back to Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Error loading chat from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(`chat_${problemId}`);
    }
    setIsHydrated(true);
  }, [problemId]);

  // Save messages to localStorage whenever they change
  const updateMessages = (newMessages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setMessages(prev => {
      const updatedMessages = typeof newMessages === 'function' ? newMessages(prev) : newMessages;
      
      // Only save to localStorage if we have messages and we've hydrated
      if (isHydrated && updatedMessages.length > 0) {
        try {
          // Convert Date objects to strings for storage
          const messagesForStorage: StoredChatMessage[] = updatedMessages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          }));
          localStorage.setItem(`chat_${problemId}`, JSON.stringify(messagesForStorage));
        } catch (error) {
          console.error('Error saving chat to localStorage:', error);
        }
      }
      return updatedMessages;
    });
  };

  // Clear chat history for the current problem
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`chat_${problemId}`);
  };

  // Get all active chat sessions
  const getActiveSessions = useCallback((): ChatSession[] => {
    if (typeof window === 'undefined') return [];
    
    const sessions: ChatSession[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chat_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(data) && data.length > 0 && data[0].content) {
            const lastMessage = data[data.length - 1];
            sessions.push({
              problemId: key.replace('chat_', ''),
              title: `Chat ${key.replace('chat_', '').substring(0, 6)}`,
              lastUpdated: new Date(lastMessage.timestamp || Date.now()),
              preview: typeof data[0].content === 'string' 
                ? data[0].content.substring(0, 30) + (data[0].content.length > 30 ? '...' : '')
                : 'New chat'
            });
          }
        } catch (e) {
          console.error('Error parsing chat session:', e);
        }
      }
    }
    return sessions.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }, []);

  return { 
    messages, 
    setMessages: updateMessages, 
    clearChat, 
    isHydrated, 
    getActiveSessions 
  };
}
