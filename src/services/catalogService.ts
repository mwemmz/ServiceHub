import {
  CATEGORIES,
  getCategoryById,
  getServiceById,
  getServicesByCategory,
  searchServices,
  SERVICES,
} from '@/data/catalog';
import { api } from '@/services/apiClient';
import { guessCategoryId } from '@/services/apiMappers';
import type { Category, CategoryId, Service } from '@/types';
import { AppConfig } from '@/constants/config';

interface ApiCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface ApiService {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
  category?: string;
  category_id?: string;
  provider_id?: string;
}

function styleForCategory(id: CategoryId): Pick<Category, 'accent' | 'background' | 'icon' | 'shortName' | 'description'> {
  const local = getCategoryById(id);
  if (local) {
    return {
      accent: local.accent,
      background: local.background,
      icon: local.icon,
      shortName: local.shortName,
      description: local.description,
    };
  }
  return {
    accent: '#C67C4E',
    background: '#F3E4D8',
    icon: 'grid-outline',
    shortName: id,
    description: 'Book trusted professionals nearby.',
  };
}

function mapApiCategory(item: ApiCategory): Category {
  const id = guessCategoryId(item.name);
  const style = styleForCategory(id);
  return {
    id,
    name: item.name,
    shortName: style.shortName,
    description: item.description || style.description,
    accent: style.accent,
    background: style.background,
    icon: item.icon || style.icon,
  };
}

function mapApiService(item: ApiService): Service {
  const categoryId = guessCategoryId(item.category ?? item.name);
  return {
    id: item.id,
    categoryId,
    group: item.category || 'General',
    name: item.name,
    description: item.description || `${item.name} offered by ServiceHub professionals.`,
    startingPrice: Number(item.price ?? 0),
    durationMinutes: Number(item.duration ?? 60),
  };
}

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await api.get<{ categories?: ApiCategory[] } | ApiCategory[]>('/categories', undefined, false);
    const list = Array.isArray(data) ? data : data.categories ?? [];
    if (list.length > 0) {
      // Deduplicate to our three top-level buckets when possible
      const mapped = list.map(mapApiCategory);
      const byId = new Map<CategoryId, Category>();
      mapped.forEach((cat) => {
        if (!byId.has(cat.id)) byId.set(cat.id, { ...cat, id: cat.id, name: CATEGORIES.find((c) => c.id === cat.id)?.name ?? cat.name });
      });
      if (byId.size > 0) return Array.from(byId.values());
    }
  } catch {
    // fall through
  }
  return AppConfig.useLocalCatalogFallback ? CATEGORIES : [];
}

export async function getCategory(id: CategoryId): Promise<Category | undefined> {
  const categories = await getCategories();
  return categories.find((item) => item.id === id) ?? getCategoryById(id);
}

export async function getServices(): Promise<Service[]> {
  try {
    const data = await api.get<{ services?: ApiService[] } | ApiService[]>('/services', undefined, false);
    const list = Array.isArray(data) ? data : data.services ?? [];
    if (list.length > 0) return list.map(mapApiService);
  } catch {
    // Services endpoint currently 500s on Render — use local catalog.
  }
  return AppConfig.useLocalCatalogFallback ? SERVICES : [];
}

export async function getService(id: string): Promise<Service | undefined> {
  try {
    const data = await api.get<{ service?: ApiService } | ApiService>(`/services/${id}`, undefined, false);
    const item = data && typeof data === 'object' && 'service' in data ? (data as { service?: ApiService }).service : (data as ApiService);
    if (item?.id) return mapApiService(item);
  } catch {
    // fall through
  }
  return getServiceById(id);
}

export async function getServicesForCategory(categoryId: CategoryId): Promise<Service[]> {
  const all = await getServices();
  const filtered = all.filter((item) => item.categoryId === categoryId);
  if (filtered.length > 0) return filtered;
  return AppConfig.useLocalCatalogFallback ? getServicesByCategory(categoryId) : [];
}

export async function searchCatalog(query: string): Promise<Service[]> {
  const term = query.trim();
  if (!term) return [];
  try {
    const data = await api.get<{ services?: ApiService[] } | ApiService[]>(
      '/services',
      { search: term },
      false,
    );
    const list = Array.isArray(data) ? data : data.services ?? [];
    if (list.length > 0) return list.map(mapApiService);
  } catch {
    // fall through
  }
  return AppConfig.useLocalCatalogFallback ? searchServices(term) : [];
}

export function getPopularServices(): Service[] {
  const popularIds = [
    'beauty-haircuts',
    'beauty-braiding',
    'beauty-makeup',
    'cleaning-general',
    'cleaning-maid',
    'repair-phone',
    'repair-plumbing',
    'repair-ac',
  ];
  return SERVICES.filter((service) => popularIds.includes(service.id));
}
