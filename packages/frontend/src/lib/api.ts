import {
  AuthResponse,
  LoginDto,
  SignupDto,
  User,
  Quest,
  QuestSubmission,
  Event,
  GatedContent,
  NFT,
  Creator,
  CreateQuestDto,
  CreateEventDto,
  CreateGatedContentDto,
  SubmitQuestDto,
} from '@/types';
import { getToken, setToken, removeToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: data,
    });
    setToken(response.access_token);
    return response;
  }

  async signup(data: SignupDto): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: data,
    });
    setToken(response.access_token);
    return response;
  }

  async logout(): Promise<void> {
    removeToken();
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Users
  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateProfile(data: { nickname?: string; bio?: string; avatarUrl?: string }): Promise<User> {
    return this.request<User>('/users/profile', {
      method: 'PATCH',
      body: data,
    });
  }

  // Creators
  async becomeCreator(data: { displayName: string; description?: string }): Promise<Creator> {
    return this.request<Creator>('/creators/register', {
      method: 'POST',
      body: data,
    });
  }

  async getCreator(id: string): Promise<Creator> {
    return this.request<Creator>(`/creators/${id}`);
  }

  async getAllCreators(): Promise<Creator[]> {
    return this.request<Creator[]>('/creators');
  }

  // Quests
  async getAllQuests(): Promise<Quest[]> {
    return this.request<Quest[]>('/quests');
  }

  async getQuest(id: string): Promise<Quest> {
    return this.request<Quest>(`/quests/${id}`);
  }

  async getActiveQuests(): Promise<Quest[]> {
    return this.request<Quest[]>('/quests/active');
  }

  async getMyQuests(): Promise<Quest[]> {
    return this.request<Quest[]>('/quests/my-quests');
  }

  async createQuest(data: CreateQuestDto): Promise<Quest> {
    return this.request<Quest>('/quests', {
      method: 'POST',
      body: data,
    });
  }

  async submitQuest(questId: string, data: SubmitQuestDto): Promise<QuestSubmission> {
    return this.request<QuestSubmission>(`/quests/${questId}/submit`, {
      method: 'POST',
      body: data,
    });
  }

  async getMySubmissions(): Promise<QuestSubmission[]> {
    return this.request<QuestSubmission[]>('/quests/submissions/my');
  }

  async reviewSubmission(
    submissionId: string,
    data: { status: 'APPROVED' | 'REJECTED' }
  ): Promise<QuestSubmission> {
    return this.request<QuestSubmission>(`/quests/submissions/${submissionId}/review`, {
      method: 'PATCH',
      body: data,
    });
  }

  // Events
  async getAllEvents(): Promise<Event[]> {
    return this.request<Event[]>('/events');
  }

  async getEvent(id: string): Promise<Event> {
    return this.request<Event>(`/events/${id}`);
  }

  async getUpcomingEvents(): Promise<Event[]> {
    return this.request<Event[]>('/events/upcoming');
  }

  async getMyEvents(): Promise<Event[]> {
    return this.request<Event[]>('/events/my-events');
  }

  async createEvent(data: CreateEventDto): Promise<Event> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: data,
    });
  }

  async generateQRCode(eventId: string, count: number = 1): Promise<{ codes: string[] }> {
    return this.request<{ codes: string[] }>(`/events/${eventId}/qr-codes`, {
      method: 'POST',
      body: { count },
    });
  }

  async redeemQRCode(code: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/events/redeem', {
      method: 'POST',
      body: { code },
    });
  }

  async getMyAttendances(): Promise<Event[]> {
    return this.request<Event[]>('/events/my-attendances');
  }

  // Gated Content
  async getAllGatedContent(): Promise<GatedContent[]> {
    return this.request<GatedContent[]>('/gated-content');
  }

  async getGatedContent(id: string): Promise<GatedContent> {
    return this.request<GatedContent>(`/gated-content/${id}`);
  }

  async accessGatedContent(id: string): Promise<{ accessUrl: string }> {
    return this.request<{ accessUrl: string }>(`/gated-content/${id}/access`);
  }

  async getMyGatedContent(): Promise<GatedContent[]> {
    return this.request<GatedContent[]>('/gated-content/my-content');
  }

  async createGatedContent(data: CreateGatedContentDto): Promise<GatedContent> {
    return this.request<GatedContent>('/gated-content', {
      method: 'POST',
      body: data,
    });
  }

  // NFTs
  async getAllNfts(): Promise<NFT[]> {
    return this.request<NFT[]>('/nfts');
  }

  async getNft(id: string): Promise<NFT> {
    return this.request<NFT>(`/nfts/${id}`);
  }

  async getMyNfts(): Promise<NFT[]> {
    return this.request<NFT[]>('/nfts/my-nfts');
  }

  async getNftsByContract(contractAddress: string): Promise<NFT[]> {
    return this.request<NFT[]>(`/nfts/contract/${contractAddress}`);
  }
}

export const api = new ApiClient(API_URL);
export default api;
