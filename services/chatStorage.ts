import { ChatSession } from "../types";

const STORAGE_KEY = 'construct_lm_chats';

export const saveChatSession = (session: ChatSession): void => {
  const sessions = getAllChatSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.unshift(session); // Add new chats at the beginning
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const getAllChatSessions = (): ChatSession[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse chat sessions', e);
    return [];
  }
};

export const deleteChatSession = (id: string): void => {
  const sessions = getAllChatSessions();
  const filtered = sessions.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getChatSession = (id: string): ChatSession | null => {
  const sessions = getAllChatSessions();
  return sessions.find(s => s.id === id) || null;
};

// Generate a title from the first user message
export const generateChatTitle = (firstMessage: string): string => {
  const maxLength = 40;
  const cleaned = firstMessage.trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength) + '...';
};
