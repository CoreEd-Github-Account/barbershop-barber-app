// app/_layout.tsx
import "../global.css";
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { configureNotifications } from '@/services/notification_service';

export default function RootLayout() {
  useEffect(() => {
    configureNotifications().catch((error) => {
      console.warn('Unable to configure notifications', error);
    });
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
