// services/reset_password_service.ts
import { API_URL as BASE_URL } from '@/config/api';

export const resetPassword = async (mobile_no: string, cnic: string, new_password: string) => {
  const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_no, cnic, new_password }),
  });

  const data = await response.json();
  return { status: response.status, data };
};