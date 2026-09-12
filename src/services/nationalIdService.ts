import { api } from '@/services/apiClient';
import type { NationalIdStatus } from '@/types';

interface NationalIdResponse {
  message?: string;
  national_id_verified?: boolean;
  national_id_number?: string | null;
  user?: { national_id_number?: string | null; national_id_verified?: boolean };
}

export async function submitNationalId(
  nationalIdNumber: string,
): Promise<{ verified: boolean; message: string }> {
  const data = await api.post<NationalIdResponse>('/national-id/submit', {
    national_id_number: nationalIdNumber,
  });
  return {
    verified: Boolean(data?.national_id_verified ?? data?.user?.national_id_verified),
    message: data?.message ?? 'National ID submitted.',
  };
}

export async function getNationalIdStatus(): Promise<NationalIdStatus> {
  const data = await api.get<NationalIdResponse>('/national-id/status');
  return {
    nationalIdNumber: data?.national_id_number ?? null,
    verified: Boolean(data?.national_id_verified),
  };
}