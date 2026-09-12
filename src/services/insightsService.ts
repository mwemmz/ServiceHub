import { api } from '@/services/apiClient';
import type { CoverageInsights, FinancialSummary } from '@/types';

interface FinancialResponse {
  summary?: {
    totalEarned?: number;
    totalJobs?: number;
    averagePerJob?: number | string;
    thisWeekJobs?: number;
    thisMonthJobs?: number;
    repeatCustomers?: number;
    paymentMethods?: string[];
  };
}

interface CoverageResponse {
  coverage?: {
    locationsCount?: number;
    uniqueAreas?: number;
    avgRating?: number;
    activeCrews?: number;
  };
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const data = await api.get<FinancialResponse>('/insights/financial');
  const s = data?.summary ?? {};
  return {
    totalEarned: Number(s.totalEarned ?? 0),
    totalJobs: Number(s.totalJobs ?? 0),
    averagePerJob: String(s.averagePerJob ?? '0.00'),
    thisWeekJobs: Number(s.thisWeekJobs ?? 0),
    thisMonthJobs: Number(s.thisMonthJobs ?? 0),
    repeatCustomers: Number(s.repeatCustomers ?? 0),
    paymentMethods: Array.isArray(s.paymentMethods) ? s.paymentMethods : [],
  };
}

export async function getCoverageInsights(): Promise<CoverageInsights> {
  const data = await api.get<CoverageResponse>('/insights/coverage');
  const c = data?.coverage ?? {};
  return {
    locationsCount: Number(c.locationsCount ?? 0),
    uniqueAreas: Number(c.uniqueAreas ?? 0),
    avgRating: Number(c.avgRating ?? 0),
    activeCrews: Number(c.activeCrews ?? 0),
  };
}