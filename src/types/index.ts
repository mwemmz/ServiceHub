export type UserRole = 'customer' | 'provider' | 'admin';

/** Distinguishes provider account subtypes after registration / login. */
export type ProviderKind = 'individual' | 'business';

export type CategoryId = 'beauty' | 'cleaning' | 'repair';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  area?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  /** Set for provider accounts — individual professional vs registered business. */
  providerKind?: ProviderKind;
  avatarUri?: string;
  isVerified: boolean;
  createdAt: string;
  location?: GeoLocation;
}

export interface AvailabilitySlot {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  label: string;
  start: string;
  end: string;
  enabled: boolean;
}

export interface ProviderService {
  serviceId: string;
  price: number;
  durationMinutes: number;
}

export interface ProviderProfile {
  userId: string;
  bio: string;
  categoryId: CategoryId;
  yearsOfExperience: number;
  isOnline: boolean;
  isSetupComplete: boolean;
  services: ProviderService[];
  serviceArea: string;
  location: GeoLocation;
  availability: AvailabilitySlot[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  portfolioUris: string[];
  earningsThisWeek: number;
}

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  description: string;
  accent: string;
  background: string;
  icon: string;
}

export interface Service {
  id: string;
  categoryId: CategoryId;
  group: string;
  name: string;
  description: string;
  startingPrice: number;
  durationMinutes: number;
}

export type BookingStatus =
  | 'request_sent'
  | 'waiting_for_provider'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface PriceBreakdown {
  base: number;
  serviceFee: number;
  platformFee: number;
  total: number;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  status: BookingStatus;
  scheduledAt: string;
  notes: string;
  price: PriceBreakdown;
  location: GeoLocation;
  createdAt: string;
  updatedAt: string;
  cancelReason?: string;
  customerRating?: number;
  /** True once the job is marked completed — counts toward confirmed work history. */
  isConfirmed?: boolean;
  /** Optional crew assigned to this booking (provider crews). */
  crewId?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type:
    | 'booking_accepted'
    | 'on_the_way'
    | 'completed'
    | 'new_request'
    | 'cancelled'
    | 'new_review'
    | 'general';
  read: boolean;
  createdAt: string;
  bookingId?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: 'ZMW';
  method: 'cash' | 'mobile_money' | 'card';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  createdAt: string;
}

export type ProviderSort = 'rating' | 'distance' | 'price' | 'availability';

export interface Certification {
  id: string;
  providerId: string;
  name: string;
  issuingBody: string;
  expiryDate: string | null;
  documentUrl: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface CrewMember {
  /** Backend provider profile id (used for add/remove member calls). */
  memberId: string;
  userId: string;
  name: string;
}

export interface Crew {
  id: string;
  leaderId: string;
  name: string;
  members: CrewMember[];
  createdAt: string;
}

export type DisputeType = 'dispute' | 'safety';

export type DisputeStatus = 'open' | 'resolved' | 'closed';

export interface Dispute {
  id: string;
  bookingId: string;
  reporterId: string;
  providerId: string;
  type: DisputeType;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolutionNote: string;
  reportedAt: string;
  createdAt: string;
}

export interface NationalIdStatus {
  nationalIdNumber: string | null;
  verified: boolean;
}

export interface FinancialSummary {
  totalEarned: number;
  totalJobs: number;
  averagePerJob: string;
  thisWeekJobs: number;
  thisMonthJobs: number;
  repeatCustomers: number;
  paymentMethods: string[];
}

export interface CoverageInsights {
  locationsCount: number;
  uniqueAreas: number;
  avgRating: number;
  activeCrews: number;
}

export interface WorkHistorySummary {
  confirmedJobs: number;
  totalEarned: number;
  totalJobs: number;
}
