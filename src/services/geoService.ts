import { api } from '@/services/apiClient';

export interface DemandCell {
  lat: number;
  lng: number;
  activeJobs: number;
  onlineWorkers: number;
  gap: number;
  underserved: boolean;
}

export interface DemandSummary {
  totalActiveJobs: number;
  totalOnlineWorkers: number;
  underservedCells: number;
  coveredCells: number;
}

export interface Opportunity {
  lat: number;
  lng: number;
  activeJobs: number;
  onlineWorkers: number;
  gap: number;
}

interface DemandResponse {
  cells?: DemandCell[];
  summary?: DemandSummary;
}

const EMPTY_SUMMARY: DemandSummary = {
  totalActiveJobs: 0,
  totalOnlineWorkers: 0,
  underservedCells: 0,
  coveredCells: 0,
};

/** Admin view: where active jobs are not being covered by online workers. */
export async function getDemandMap(): Promise<{ cells: DemandCell[]; summary: DemandSummary }> {
  try {
    const data = await api.get<DemandResponse>('/admin/demand-map');
    return {
      cells: data?.cells ?? [],
      summary: data?.summary ?? EMPTY_SUMMARY,
    };
  } catch {
    return { cells: [], summary: EMPTY_SUMMARY };
  }
}

/** Provider view: the underserved neighbourhoods sorted by greatest gap. */
export async function getOpportunities(): Promise<Opportunity[]> {
  try {
    const data = await api.get<{ opportunities?: Opportunity[] }>('/providers/opportunities');
    return data?.opportunities ?? [];
  } catch {
    return [];
  }
}