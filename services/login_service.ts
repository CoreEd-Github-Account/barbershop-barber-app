// services/login_service.ts
import { API_URL as BASE_URL } from '@/config/api';

export const loginUser = async (mobile_no: string, password: string) => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile_no, password }),
  });

  const data = await response.json();
  return { status: response.status, data };
};