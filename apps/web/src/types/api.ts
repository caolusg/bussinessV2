export type Role = 'user' | 'assistant' | 'system';
export type Locale = 'zh' | 'en';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Message {
  role: Role;
  content: string;
  createdAt: string;
}

export interface Session {
  sessionId: string;
  scenario?: string;
  locale?: Locale;
  messages: Message[];
}

export interface CreateSessionRequest {
  scenario: string;
  locale: Locale;
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface SaveMessageRequest {
  role: 'user';
  content: string;
}

export interface AIReplyRequest {
  locale: Locale;
}

export interface AIReplyResponse {
  reply: string;
}
