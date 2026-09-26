// services/signup_service.ts
import { API_URL as BASE_URL } from '@/config/api';

export interface BarberSignupPayload {
  name: string;
  gender: 'male' | 'female' | 'other' | '';
  mobile_no: string;
  password: string;
  role: 'barber';
  bank_type: string;
  bank_name?: string;
  account_title: string;
  bank_account_number: string;
  address: string;
  email?: string;
  cnic?: string;
  profile_picture_base64: string;
  cnic_front_image_base64: string;
  cnic_back_image_base64: string;
  [key: string]: unknown;
}

export const signupUser = async (payload: Record<string, unknown> | BarberSignupPayload) => {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { status: response.status, data };
};