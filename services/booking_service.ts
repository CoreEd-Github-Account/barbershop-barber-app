// services/booking_service.ts
import { API_URL as BASE_URL } from '@/config/api';

interface ServiceItem {
  key: string;
  label: string;
  price: number;
}

export interface IncomingBookingRequest {
  id: string;
  services: { key: string; label: string; price: number }[];
  total_amount: number;
  number_of_persons: number;
  created_at: string;
  customer_name: string;
  customer_mobile: string;
  customer_latitude: number | null;
  customer_longitude: number | null;
  distance_km: number | null;
  estimated_minutes: number | null;
}

export const createBooking = async (token: string, barber_id: string, services: ServiceItem[], latitude: number, longitude: number) => {
  const response = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ barber_id, services, latitude, longitude }),
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const getBooking = async (token: string, id: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const getIncomingRequests = async (
  token: string
): Promise<{ status: number; data: { requests: IncomingBookingRequest[]; message?: string } }> => {
  const response = await fetch(`${BASE_URL}/api/bookings/incoming`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const acceptBooking = async (token: string, id: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/${id}/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const rejectBooking = async (token: string, id: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/${id}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const cancelBooking = async (token: string, id: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const completeBooking = async (token: string, id: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/${id}/complete`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const getMyBookings = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/mine`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  return { status: response.status, data };
};

export const getTodayStats = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/stats/today`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  return { status: response.status, data };
};

export type EarningsPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export const getEarningsHistory = async (
  token: string,
  period: EarningsPeriod,
  startDate?: string,
  endDate?: string,
) => {
  const query = [`period=${encodeURIComponent(period)}`];
  if (period === 'custom' && startDate && endDate) {
    query.push(`start_date=${encodeURIComponent(startDate)}`);
    query.push(`end_date=${encodeURIComponent(endDate)}`);
  }

  const response = await fetch(`${BASE_URL}/api/bookings/earnings?${query.join('&')}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  return { status: response.status, data };
};

export const getCustomerCancellations = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/customer-cancellations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const cancelAcceptedBooking = async (token: string, id: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/${id}/barber-cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const getMyBookingsAsCustomer = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/bookings/customer/mine`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  return { status: response.status, data };
};
