import { api } from '@/services/apiClient';
import type { Review } from '@/types';

interface ApiReview {
  id: string;
  booking_id?: string;
  customer_id?: string;
  provider_id?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
  created_at?: string;
}

function mapReview(item: ApiReview): Review {
  return {
    id: item.id,
    bookingId: item.booking_id ?? '',
    fromUserId: item.customer_id ?? '',
    toUserId: item.provider_id ?? '',
    rating: Number(item.rating ?? 0),
    comment: item.comment ?? '',
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
  };
}

export async function getReviewsForUser(userId: string): Promise<Review[]> {
  try {
    const data = await api.get<{ reviews?: ApiReview[] } | ApiReview[]>(
      `/reviews/provider/${userId}`,
      undefined,
      false,
    );
    const list = Array.isArray(data) ? data : data.reviews ?? [];
    return list.map(mapReview).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } catch {
    const { getStoredReviews } = await import('@/services/localDb');
    const reviews = await getStoredReviews();
    return reviews
      .filter((item) => item.toUserId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
}

export async function getReviewForBooking(bookingId: string, fromUserId: string): Promise<Review | undefined> {
  const { getStoredReviews } = await import('@/services/localDb');
  const reviews = await getStoredReviews();
  return reviews.find((item) => item.bookingId === bookingId && item.fromUserId === fromUserId);
}

export async function createReview(input: {
  bookingId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  try {
    const data = await api.post<{ review?: ApiReview } | ApiReview>('/reviews', {
      booking_id: input.bookingId,
      rating: input.rating,
      comment: input.comment.trim(),
    });
    const item =
      data && typeof data === 'object' && 'review' in data
        ? (data as { review?: ApiReview }).review
        : (data as ApiReview);
    if (item?.id) return mapReview(item);
  } catch {
    // local fallback
  }

  const existing = await getReviewForBooking(input.bookingId, input.fromUserId);
  if (existing) throw new Error('You already reviewed this booking.');

  const { getStoredReviews, saveReviews } = await import('@/services/localDb');
  const { createId } = await import('@/utils/id');
  const review: Review = {
    id: createId('review'),
    bookingId: input.bookingId,
    fromUserId: input.fromUserId,
    toUserId: input.toUserId,
    rating: input.rating,
    comment: input.comment.trim(),
    createdAt: new Date().toISOString(),
  };
  const reviews = await getStoredReviews();
  await saveReviews([review, ...reviews]);
  return review;
}
