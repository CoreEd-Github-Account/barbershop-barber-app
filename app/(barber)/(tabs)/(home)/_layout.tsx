// app/(barber)/(tabs)/(home)/_layout.tsx
import { Stack } from 'expo-router';

export default function HomeStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}