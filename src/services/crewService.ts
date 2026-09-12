import { api } from '@/services/apiClient';
import type { Crew, CrewMember } from '@/types';

interface ApiMember {
  id?: string;
  user_id?: string;
  business_name?: string;
  user?: { id?: string; name?: string } | null;
}

interface ApiCrew {
  id?: string;
  leader_id?: string;
  name?: string;
  members?: ApiMember[];
  created_at?: string;
  createdAt?: string;
}

function mapMember(item: ApiMember): CrewMember {
  return {
    memberId: item.id ?? '',
    userId: item.user_id ?? item.user?.id ?? item.id ?? '',
    name: item.user?.name ?? item.business_name ?? 'Member',
  };
}

function mapCrew(item: ApiCrew): Crew {
  return {
    id: item.id ?? '',
    leaderId: item.leader_id ?? '',
    name: item.name ?? 'Untitled crew',
    members: (item.members ?? []).map(mapMember),
    createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
  };
}

function unwrapCrew(data: unknown): ApiCrew | undefined {
  if (data && typeof data === 'object' && 'crew' in data) {
    return (data as { crew?: ApiCrew }).crew;
  }
  return data as ApiCrew;
}

export async function getMyCrews(): Promise<Crew[]> {
  const data = await api.get<unknown>('/crews/mine');
  const list =
    data && typeof data === 'object' && 'crews' in data
      ? (data as { crews?: ApiCrew[] }).crews ?? []
      : [];
  return list.map(mapCrew);
}

export async function getCrewById(id: string): Promise<Crew | undefined> {
  const data = await api.get<unknown>(`/crews/${id}`);
  const crew = unwrapCrew(data);
  return crew?.id ? mapCrew(crew) : undefined;
}

export async function createCrew(name: string): Promise<Crew> {
  const data = await api.post<unknown>('/crews', { name });
  const crew = unwrapCrew(data);
  if (!crew?.id) throw new Error('Crew was not created.');
  return mapCrew(crew);
}

export async function deleteCrew(id: string): Promise<void> {
  await api.del(`/crews/${id}`);
}

export async function addCrewMember(crewId: string, memberProviderId: string): Promise<void> {
  await api.post(`/crews/${crewId}/members`, { provider_id: memberProviderId });
}

export async function removeCrewMember(crewId: string, memberProviderId: string): Promise<void> {
  await api.del(`/crews/${crewId}/members/${memberProviderId}`);
}