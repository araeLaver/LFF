// User types
export interface User {
  id: string;
  email: string;
  role: 'USER' | 'CREATOR' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
  wallet?: Wallet;
  creator?: Creator;
}

export interface Profile {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  createdAt: string;
  nfts?: NFT[];
}

// Creator types
export interface Creator {
  id: string;
  userId: string;
  displayName: string;
  description?: string;
  profileImageUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  quests?: Quest[];
  events?: Event[];
  gatedContents?: GatedContent[];
}

// Quest types
export type QuestType = 'SOCIAL_SHARE' | 'CONTENT_VIEW' | 'QUIZ' | 'SURVEY' | 'CUSTOM';
export type QuestStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Quest {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  imageUrl?: string;
  type: QuestType;
  requirements?: Record<string, unknown>;
  rewardType: string;
  rewardAmount: number;
  maxParticipants?: number;
  startDate: string;
  endDate?: string;
  status: QuestStatus;
  createdAt: string;
  updatedAt: string;
  creator?: Creator;
  submissions?: QuestSubmission[];
  _count?: {
    submissions: number;
  };
}

export interface QuestSubmission {
  id: string;
  questId: string;
  userId: string;
  submissionData?: Record<string, unknown>;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  quest?: Quest;
  user?: User;
}

// Event types
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'ENDED' | 'CANCELLED';

export interface Event {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  imageUrl?: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxAttendees?: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  creator?: Creator;
  qrCodes?: QRCode[];
  attendances?: EventAttendance[];
  _count?: {
    attendances: number;
  };
}

export interface QRCode {
  id: string;
  eventId: string;
  code: string;
  isUsed: boolean;
  usedAt?: string;
  usedBy?: string;
  expiresAt?: string;
  createdAt: string;
  event?: Event;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  userId: string;
  attendedAt: string;
  nftMinted: boolean;
  event?: Event;
  user?: User;
}

// NFT types
export type TokenType = 'EVENT_ATTENDANCE' | 'QUEST_COMPLETION';

export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  metadataUrl: string;
  ownerId: string;
  createdAt: string;
  owner?: Wallet;
  // On-chain metadata
  tokenType?: TokenType | null;
  referenceId?: string | null;
  mintedAt?: string | null;
  // Related data
  event?: Event | null;
  quest?: Quest | null;
}

// Gated Content types
export type ContentType = 'VIDEO' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'OTHER';

export interface GatedContent {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  contentType: ContentType;
  contentUrl: string;
  requiredNftContract: string;
  requiredTokenId?: string;
  createdAt: string;
  updatedAt: string;
  creator?: Creator;
}

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// API Response types
export interface ApiError {
  message: string;
  error?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Form types
export interface CreateQuestDto {
  title: string;
  description: string;
  imageUrl?: string;
  type: QuestType;
  requirements?: Record<string, unknown>;
  rewardType: string;
  rewardAmount: number;
  maxParticipants?: number;
  startDate: string;
  endDate?: string;
}

export interface CreateEventDto {
  title: string;
  description: string;
  imageUrl?: string;
  location?: string;
  startDate: string;
  endDate: string;
  maxAttendees?: number;
}

export interface CreateGatedContentDto {
  title: string;
  description?: string;
  contentType: ContentType;
  contentUrl: string;
  requiredNftContract: string;
  requiredTokenId?: string;
}

export interface SubmitQuestDto {
  submissionData?: Record<string, unknown>;
}
