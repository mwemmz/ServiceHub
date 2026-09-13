import { api } from '@/services/apiClient';

export type EndorsementStatus = 'pending' | 'confirmed' | 'declined';

interface ApiEndorsement {
  id: string;
  booking_id?: string;
  requester_id?: string;
  peer_id?: string;
  peer_user_email?: string;
  status?: EndorsementStatus;
  note?: string | null;
  responded_at?: string | null;
  createdAt?: string;
  booking?: {
    booking_time?: string;
    total_amount?: number | string;
    address?: string;
    customer?: { id?: string; name?: string } | null;
    provider?: { id?: string; business_name?: string } | null;
    service?: { id?: string; name?: string } | null;
  };
}

export interface VerificationForBooking {
  status: EndorsementStatus | null;
  peerEmail: string;
  note: string | null;
  createdAt: string | null;
  verified: boolean;
  customerReviewed: boolean;
  customerRating: number | null;
}

export interface PendingEndorsement {
  id: string;
  bookingId: string;
  status: EndorsementStatus;
  note: string | null;
  createdAt: string;
  serviceName: string;
  customerName: string;
  requester: string;
  scheduledAt: string;
  amount: number;
}

/** Maps the raw /endorsements response into the UI model. */
function mapEndorsement(raw: ApiEndorsement): PendingEndorsement {
  return {
    id: raw.id,
    bookingId: raw.booking_id ?? '',
    status: raw.status ?? 'pending',
    note: raw.note ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    serviceName: raw.booking?.service?.name ?? 'Service',
    customerName: raw.booking?.customer?.name ?? 'Customer',
    requester: raw.booking?.provider?.business_name ?? 'A fellow worker',
    scheduledAt: raw.booking?.booking_time ?? raw.createdAt ?? new Date().toISOString(),
    amount: Number(raw.booking?.total_amount ?? 0),
  };
}

/** Ask a peer worker (by email) to vouch for a completed job you performed. */
export async function requestEndorsement(bookingId: string, email: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/endorsements/request/${bookingId}`, { email });
}

/** Verification requests awaiting YOUR confirmation. */
export async function getPendingEndorsements(): Promise<PendingEndorsement[]> {
  try {
    const data = await api.get<{ endorsements?: ApiEndorsement[] }>('/endorsements/pending');
    const list = data?.endorsements ?? [];
    return list.map(mapEndorsement);
  } catch {
    return [];
  }
}

/** Confirm that a job actually happened (anti-fraud second half). */
export async function confirmEndorsement(id: string, note?: string): Promise<void> {
  await api.post(`/endorsements/${id}/confirm`, { note });
}

/** Decline to vouch for a job. */
export async function declineEndorsement(id: string): Promise<void> {
  await api.post(`/endorsements/${id}/decline`);
}

/** Current verification state of a single booking (job detail screen). */
export async function getEndorsementForBooking(bookingId: string): Promise<VerificationForBooking> {
  const data = await api.get<{
    endorsement?: ApiEndorsement | null;
    customerReview?: { id?: string; rating?: number } | null;
    verified?: boolean;
  }>(`/endorsements/booking/${bookingId}`);
  return {
    status: data?.endorsement?.status ?? null,
    peerEmail: data?.endorsement?.peer_user_email ?? '',
    note: data?.endorsement?.note ?? null,
    createdAt: data?.endorsement?.createdAt ?? null,
    verified: Boolean(data?.verified),
    customerReviewed: Boolean(data?.customerReview),
    customerRating: data?.customerReview?.rating ?? null,
  };
}