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
  UpdateGatedContentDto,
  SubmitQuestDto,
} from '@/types';
import { getToken, setToken, removeToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  optimized?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
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
    setToken(response.accessToken);
    return response;
  }

  async signup(data: SignupDto): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: data,
    });
    setToken(response.accessToken);
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
    return this.request<Creator>('/creators/become', {
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
    return this.request<Quest[]>('/quests');
  }

  async getMyQuests(): Promise<Quest[]> {
    return this.request<Quest[]>('/quests/creator/my-quests');
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
    return this.request<QuestSubmission[]>('/quests/user/my-submissions');
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
    return this.request<Event[]>('/events');
  }

  async getMyEvents(): Promise<Event[]> {
    return this.request<Event[]>('/events/creator/my-events');
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

  async getGatedContentPreview(id: string): Promise<GatedContent> {
    return this.request<GatedContent>(`/gated-content/${id}/preview`);
  }

  async getGatedContent(id: string): Promise<GatedContent> {
    return this.request<GatedContent>(`/gated-content/${id}`);
  }

  async checkGatedContentAccess(id: string): Promise<{ hasAccess: boolean; reason?: string }> {
    return this.request<{ hasAccess: boolean; reason?: string }>(`/gated-content/${id}/check-access`);
  }

  async accessGatedContent(id: string): Promise<{ accessUrl: string; contentType: string; title: string }> {
    return this.request<{ accessUrl: string; contentType: string; title: string }>(`/gated-content/${id}/access`);
  }

  async getMyGatedContent(): Promise<GatedContent[]> {
    return this.request<GatedContent[]>('/gated-content/creator/my-content');
  }

  async createGatedContent(data: CreateGatedContentDto): Promise<GatedContent> {
    return this.request<GatedContent>('/gated-content', {
      method: 'POST',
      body: data,
    });
  }

  async updateGatedContent(id: string, data: UpdateGatedContentDto): Promise<GatedContent> {
    return this.request<GatedContent>(`/gated-content/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async deleteGatedContent(id: string): Promise<void> {
    return this.request<void>(`/gated-content/${id}`, {
      method: 'DELETE',
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

  // Upload
  async uploadImage(file: File, category: 'quests' | 'events' | 'profiles'): Promise<UploadResponse> {
    return this.uploadFile<UploadResponse>(`/upload/image/${category}`, file);
  }

  // Wallet
  async getWalletNonce(address: string): Promise<{ nonce: string; message: string }> {
    return this.request<{ nonce: string; message: string }>(`/wallet/nonce?address=${address}`);
  }

  async getMyWallet(): Promise<any> {
    return this.request<any>('/wallet');
  }

  async linkWallet(data: {
    address: string;
    signature: string;
    message: string;
    chainId?: number;
  }): Promise<any> {
    return this.request<any>('/wallet/link', {
      method: 'POST',
      body: data,
    });
  }

  async unlinkWallet(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/wallet/unlink', {
      method: 'DELETE',
    });
  }

  // NFT Minting (Creator)
  async mintNFT(data: {
    recipientAddress: string;
    name: string;
    description?: string;
    imageUrl?: string;
    tokenType: 'EVENT_ATTENDANCE' | 'QUEST_COMPLETION' | 'CUSTOM';
    referenceId?: string;
  }): Promise<{ tokenId: string; transactionHash: string }> {
    return this.request<{ tokenId: string; transactionHash: string }>('/nfts/mint', {
      method: 'POST',
      body: data,
    });
  }

  // Admin
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalCreators: number;
    totalQuests: number;
    totalEvents: number;
    totalNfts: number;
    totalGatedContent: number;
    recentUsers: number;
    pendingSubmissions: number;
  }> {
    return this.request('/admin/stats');
  }

  async getAdminUsers(page: number = 1, limit: number = 20, search?: string): Promise<{
    users: Array<{
      id: string;
      email: string;
      role: string;
      provider: string | null;
      nickname: string | null;
      avatarUrl: string | null;
      hasWallet: boolean;
      isCreator: boolean;
      createdAt: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return this.request(`/admin/users?${params.toString()}`);
  }

  async updateUserRole(userId: string, role: 'USER' | 'CREATOR' | 'ADMIN'): Promise<any> {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: { role },
    });
  }

  async getAdminCreators(page: number = 1, limit: number = 20): Promise<{
    creators: Array<{
      id: string;
      userId: string;
      email: string;
      nickname: string | null;
      avatarUrl: string | null;
      questsCount: number;
      eventsCount: number;
      gatedContentCount: number;
      createdAt: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.request(`/admin/creators?page=${page}&limit=${limit}`);
  }

  async getAdminQuests(page: number = 1, limit: number = 20): Promise<{
    quests: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.request(`/admin/quests?page=${page}&limit=${limit}`);
  }

  async deleteAdminQuest(questId: string): Promise<void> {
    return this.request(`/admin/quests/${questId}`, { method: 'DELETE' });
  }

  async getAdminEvents(page: number = 1, limit: number = 20): Promise<{
    events: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.request(`/admin/events?page=${page}&limit=${limit}`);
  }

  async deleteAdminEvent(eventId: string): Promise<void> {
    return this.request(`/admin/events/${eventId}`, { method: 'DELETE' });
  }

  async getAdminGatedContent(page: number = 1, limit: number = 20): Promise<{
    contents: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.request(`/admin/gated-content?page=${page}&limit=${limit}`);
  }

  async deleteAdminGatedContent(contentId: string): Promise<void> {
    return this.request(`/admin/gated-content/${contentId}`, { method: 'DELETE' });
  }

  // Notifications
  async getVapidPublicKey(): Promise<{ publicKey: string | null }> {
    return this.request('/notifications/vapid-public-key');
  }

  async subscribePush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<any> {
    return this.request('/notifications/subscribe', {
      method: 'POST',
      body: subscription,
    });
  }

  async unsubscribePush(endpoint: string): Promise<any> {
    return this.request('/notifications/unsubscribe', {
      method: 'DELETE',
      body: { endpoint },
    });
  }

  async getNotifications(page: number = 1, limit: number = 20): Promise<{
    notifications: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      data: any;
      isRead: boolean;
      createdAt: string;
    }>;
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  }> {
    return this.request(`/notifications?page=${page}&limit=${limit}`);
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.request('/notifications/unread-count');
  }

  async markNotificationRead(id: string): Promise<any> {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead(): Promise<any> {
    return this.request('/notifications/read-all', { method: 'PATCH' });
  }

  async getMintingHistory(): Promise<{
    id: string;
    tokenId: string;
    name: string | null;
    description: string | null;
    imageUrl: string | null;
    tokenType: string | null;
    referenceId: string | null;
    transactionHash: string | null;
    recipientAddress: string;
    recipientNickname: string | null;
    mintedAt: string;
  }[]> {
    return this.request('/nfts/minting-history');
  }
}

export const api = new ApiClient(API_URL);
export default api;
