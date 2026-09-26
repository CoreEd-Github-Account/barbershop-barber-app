// services/user_service.ts
import { API_URL as BASE_URL } from '@/config/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  mobile_no: string;
  role: string;
  is_active: boolean;
  is_online: boolean;
  gender: 'male' | 'female' | 'other' | '';
  cnic: string | null;
  address: string | null;
  profile_picture: string | null;
  cnic_front_image: string | null;
  cnic_back_image: string | null;
  average_rating: number | null;
  wallet_balance?: number;
  is_wallet_blocked?: boolean;
  has_free_completed_booking?: boolean;
  pending_commission_due?: number;
  created_at?: string;
}

export interface PaymentConfig {
  bank_name: string;
  account_title: string;
  account_number: string;
  whatsapp_number: string;
  qr_image_url: string;
}

export type Barber = UserProfile;

export const getMyProfile = async (token: string): Promise<{ status: number; data: { user: UserProfile; message?: string } }> => {
  const response = await fetch(`${BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return { status: response.status, data };
};

export const getPaymentConfig = async (
  token: string
): Promise<{ status: number; data: PaymentConfig & { message?: string } }> => {
  const response = await fetch(`${BASE_URL}/api/barbers/payment-config`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  return { status: response.status, data };
};



export const updateMyProfile = async (
  token: string,
  name: string,
  email: string,
  mobile_no: string,
  gender: 'male' | 'female' | 'other'
) => {
  const response = await fetch(`${BASE_URL}/api/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, email: email || undefined, mobile_no, gender }),
  });

  const data = await response.json();
  return { status: response.status, data };
};



export const getBankAccounts = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/users/me/bank-accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const addBankAccount = async (
  token: string,
  bank_type: string,
  bank_name: string | undefined,
  account_title: string,
  account_number: string
) => {
  const response = await fetch(`${BASE_URL}/api/users/me/bank-accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ bank_type, bank_name, account_title, account_number }),
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const deleteBankAccount = async (token: string, id: string) => {
  const response = await fetch(`${BASE_URL}/api/users/me/bank-accounts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};



export const updateCnicAddress = async (token: string, cnic: string, address: string) => {
  const response = await fetch(`${BASE_URL}/api/users/me/cnic-address`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ cnic: cnic || undefined, address }),
  });
  const data = await response.json();
  return { status: response.status, data };
};



export const updateAvailability = async (token: string, is_online: boolean, latitude?: number, longitude?: number) => {
  const response = await fetch(`${BASE_URL}/api/users/me/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_online, latitude, longitude }),
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const getMyServices = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/users/me/services`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  return { status: response.status, data };
};

export const updateMyServices = async (token: string, services: string[]) => {
  const response = await fetch(`${BASE_URL}/api/users/me/services`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ services }),
  });
  const data = await response.json();
  return { status: response.status, data };
};
