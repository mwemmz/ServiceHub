import { api } from '@/services/apiClient';

export interface PaymentInitResult {
  paymentUrl?: string;
  transactionRef?: string;
  raw: unknown;
}

export async function initializePayment(bookingId: string, paymentMethod: string): Promise<PaymentInitResult> {
  const data = await api.post<Record<string, unknown>>('/payments/initialize', {
    booking_id: bookingId,
    payment_method: paymentMethod,
  });
  return {
    paymentUrl: (data.payment_url || data.paymentUrl || data.url) as string | undefined,
    transactionRef: (data.transaction_ref || data.transactionRef || data.reference) as string | undefined,
    raw: data,
  };
}

export async function verifyPayment(transactionRef: string): Promise<unknown> {
  return api.post('/payments/verify', { transaction_ref: transactionRef });
}

export async function getPaymentsForBooking(bookingId: string): Promise<unknown> {
  return api.get(`/payments/booking/${bookingId}`);
}
