import { api } from '@/services/apiClient';
import type { Dispute, DisputeType } from '@/types';

interface ApiDispute {
  id?: string;
  booking_id?: string;
  reporter_id?: string;
  provider_id?: string;
  type?: string;
  reason?: string;
  description?: string;
  status?: string;
  resolution_note?: string;
  reported_at?: string;
  created_at?: string;
  createdAt?: string;
}

const VALID_TYPES: DisputeType[] = ['dispute', 'safety'];
const VALID_STATUSES = ['open', 'resolved', 'closed'] as const;

function mapDispute(item: ApiDispute): Dispute {
  return {
    id: item.id ?? '',
    bookingId: item.booking_id ?? '',
    reporterId: item.reporter_id ?? '',
    providerId: item.provider_id ?? '',
    type: VALID_TYPES.includes(item.type as DisputeType) ? (item.type as DisputeType) : 'dispute',
    reason: item.reason ?? '',
    description: item.description ?? '',
    status: VALID_STATUSES.includes(item.status as typeof VALID_STATUSES[number])
      ? (item.status as typeof VALID_STATUSES[number])
      : 'open',
    resolutionNote: item.resolution_note ?? '',
    reportedAt: item.reported_at ?? item.created_at ?? item.createdAt ?? new Date().toISOString(),
    createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
  };
}

export interface SubmitDisputeInput {
  bookingId: string;
  type: DisputeType;
  reason: string;
  description: string;
}

export async function submitDispute(input: SubmitDisputeInput): Promise<Dispute> {
  const data = await api.post<unknown>('/disputes', {
    booking_id: input.bookingId,
    type: input.type,
    reason: input.reason,
    description: input.description,
  });
  const dispute =
    data && typeof data === 'object' && 'dispute' in data
      ? (data as { dispute?: ApiDispute }).dispute
      : (data as ApiDispute);
  if (!dispute?.id) throw new Error('Report was not submitted.');
  return mapDispute(dispute);
}

export async function getMyDisputes(): Promise<Dispute[]> {
  const data = await api.get<unknown>('/disputes/mine');
  const list =
    data && typeof data === 'object' && 'disputes' in data
      ? (data as { disputes?: ApiDispute[] }).disputes ?? []
      : [];
  return list.map(mapDispute).sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
}