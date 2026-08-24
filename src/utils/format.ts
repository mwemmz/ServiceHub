import type { BookingStatus } from '@/types';

export function formatKwacha(amount: number): string {
  return `K ${Math.round(amount).toLocaleString('en-ZM')}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}

export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function bookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    request_sent: 'Request sent',
    waiting_for_provider: 'Waiting for provider',
    accepted: 'Accepted',
    on_the_way: 'On the way',
    arrived: 'Arrived',
    in_progress: 'Service in progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

export function isActiveBooking(status: BookingStatus): boolean {
  return status !== 'completed' && status !== 'cancelled';
}

export function calculatePrice(base: number) {
  const serviceFee = Math.round(base * 0.15);
  const platformFee = Math.round(base * 0.1);
  return {
    base,
    serviceFee,
    platformFee,
    total: base + serviceFee + platformFee,
  };
}

export function estimateArrivalMinutes(distanceKm: number): number {
  const citySpeedKmh = 25;
  return Math.max(5, Math.round((distanceKm / citySpeedKmh) * 60));
}
