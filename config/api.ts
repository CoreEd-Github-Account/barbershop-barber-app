// config/api.ts
// Default to the local development server. Set EXPO_PUBLIC_API_URL when the
// app needs to reach a different development machine on the same network.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.45:3000';
