import { api } from '@/services/apiClient';
import { getBackendProviderId } from '@/services/backendProviders';
import type { Certification } from '@/types';

interface ApiCertification {
  id?: string;
  provider_id?: string;
  name?: string;
  issuing_body?: string;
  expiry_date?: string | null;
  document_url?: string | null;
  is_verified?: boolean;
  created_at?: string;
  createdAt?: string;
}

function mapCertification(item: ApiCertification): Certification {
  return {
    id: item.id ?? '',
    providerId: item.provider_id ?? '',
    name: item.name ?? '',
    issuingBody: item.issuing_body ?? '',
    expiryDate: item.expiry_date ?? null,
    documentUrl: item.document_url ?? null,
    isVerified: Boolean(item.is_verified),
    createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
  };
}

export interface AddCertificationInput {
  name: string;
  issuingBody: string;
  expiryDate?: string | null;
  documentUrl?: string | null;
}

export async function getMyCertifications(userId: string): Promise<Certification[]> {
  const providerId = await getBackendProviderId(userId);
  if (!providerId) return [];
  const data = await api.get<unknown>(`/certifications/provider/${providerId}`, undefined, false);
  const list = Array.isArray(data)
    ? (data as ApiCertification[])
    : (data as { certifications?: ApiCertification[] }).certifications ?? [];
  return list.map(mapCertification);
}

export async function addCertification(input: AddCertificationInput): Promise<Certification> {
  const data = await api.post<unknown>('/certifications', {
    name: input.name,
    issuing_body: input.issuingBody,
    expiry_date: input.expiryDate ?? null,
    document_url: input.documentUrl ?? null,
  });
  const item =
    data && typeof data === 'object' && 'cert' in data
      ? (data as { cert?: ApiCertification }).cert
      : (data as ApiCertification);
  if (!item?.id) throw new Error('Certification was not created.');
  return mapCertification(item);
}

export async function deleteCertification(id: string): Promise<void> {
  await api.del(`/certifications/${id}`);
}