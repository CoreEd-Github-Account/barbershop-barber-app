// app/(barber)/(tabs)/_layout.tsx
import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getMyProfile } from '@/services/user_service';

export default function BarberTabsLayout() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const checkWalletLock = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      try {
        const { status, data } = await getMyProfile(token);
        if (status === 200 && data?.user?.is_wallet_blocked && isMounted) {
          router.replace('/wallet-locked');
        }
      } catch {
        // Silently ignore background check network errors
      }
    };
    checkWalletLock();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#101B30',
          borderTopColor: '#334155',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
