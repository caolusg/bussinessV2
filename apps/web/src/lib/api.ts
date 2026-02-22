import { 
  AuthResponse, 
  Session, 
  CreateSessionResponse, 
  AIReplyResponse,
  Locale,
  User
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  auth: {
    async register(data: any): Promise<{ ok: boolean }> {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Registration failed');
      return res.json();
    },
    async login(data: any): Promise<AuthResponse> {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Login failed');
      return res.json();
    }
  },

  negotiation: {
    async createSession(data: { scenario: string, locale: Locale }): Promise<CreateSessionResponse> {
      const res = await fetch(`${BASE_URL}/api/negotiation/sessions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create session');
      return res.json();
    },

    async getSession(id: string): Promise<Session> {
      const res = await fetch(`${BASE_URL}/api/negotiation/sessions/${id}`, {
        headers: { ...getAuthHeader() }
      });
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    },

    async saveMessage(sessionId: string, content: string): Promise<{ ok: boolean }> {
      const res = await fetch(`${BASE_URL}/api/negotiation/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to save message');
      return res.json();
    },

    async getAIReply(sessionId: string, locale: Locale): Promise<AIReplyResponse> {
      const res = await fetch(`${BASE_URL}/api/negotiation/sessions/${sessionId}/ai-reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) throw new Error('Failed to get AI reply');
      return res.json();
    }
  }
};
