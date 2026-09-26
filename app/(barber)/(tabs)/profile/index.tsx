// app/(barber)/(tabs)/profile/index.tsx
import { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { getMyProfile, UserProfile } from '@/services/user_service';

type Profile = UserProfile;

const MENU_ITEMS = [
  { icon: 'person-outline', title: 'Personal Information', subtitle: 'Manage name, email & phone' },
  { icon: 'cut-outline', title: 'Services', subtitle: 'Choose the services you offer' },
  { icon: 'card-outline', title: 'Bank Details', subtitle: 'Manage your payout account' },
  { icon: 'document-text-outline', title: 'CNIC & Address', subtitle: 'Identity and shop location' },
  { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'FAQ, chat support & feedback' },
] as const;

export default function BarberProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = await SecureStore.getItemAsync('token');

    if (!token) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    const { status, data } = await getMyProfile(token);

    if (status !== 200) {
      router.replace('/login');
      return;
    }

    if (data.user.is_wallet_blocked) {
      router.replace('/wallet-locked');
      return;
    }

    setProfile(data.user);
    setImageError(false);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleLogout = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('token'),
      SecureStore.deleteItemAsync('role'),
      SecureStore.deleteItemAsync('remembered_password'),
    ]);

    router.replace('/login');
  };

  if (loading || !profile) {
    return (
      <View className="flex-1 bg-[#0D1628] items-center justify-center">
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const showImage = profile.profile_picture && !imageError;

  return (
    <View className="flex-1 bg-[#0D1628]">
      <View className="px-5 pt-14 pb-5 bg-[#101B30] border-b border-slate-700">
        <Text className="text-xs tracking-[3px] text-amber-600 font-semibold">SALON AT HOME</Text>
        <Text className="text-xl font-bold text-white mt-1">Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
        <View className="items-center mb-7 rounded-3xl border border-slate-700 bg-slate-800/80 p-6">
          {showImage ? (
            <Image
              source={{ uri: profile.profile_picture! }}
              className="w-24 h-24 rounded-full mb-4"
              onError={() => setImageError(true)}
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-amber-700 items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">{initials}</Text>
            </View>
          )}
          <Text className="text-2xl font-bold text-white">{profile.name}</Text>
          <Text className="text-sm text-slate-400 mt-1">Professional barber</Text>
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <Text className="text-xs text-slate-400 mb-2 font-semibold">WALLET BALANCE</Text>
            <Text className="text-white font-bold text-base">PKR {(profile.wallet_balance ?? 0).toFixed(2)}</Text>
          </View>
          <View className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <Text className="text-xs text-slate-400 mb-2 font-semibold">AVERAGE RATING</Text>
            <Text className="text-amber-600 font-bold text-base">{profile.average_rating !== null ? `${profile.average_rating} / 5` : 'Not rated yet'}</Text>
          </View>
        </View>

        <View className="bg-slate-800 rounded-2xl border border-slate-700 px-4">
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => {
                if (item.title === 'Personal Information') router.push('/profile/personal-information');
                else if (item.title === 'Services') router.push('/profile/services');
                else if (item.title === 'Bank Details') router.push('/profile/bank-details');
                else if (item.title === 'CNIC & Address') router.push('/profile/cnic-address');
                else if (item.title === 'Help & Support') router.push('/profile/help-support');
              }}
              className={`flex-row items-center py-4 ${idx !== MENU_ITEMS.length - 1 ? 'border-b border-slate-700' : ''}`}
            >
              <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"><Ionicons name={item.icon} size={21} color="#D4AF37" /></View>
              <View className="flex-1 ml-4">
                <Text className="text-base font-semibold text-white">{item.title}</Text>
                <Text className="text-sm text-slate-400">{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={handleLogout} className="flex-row items-center py-4">
            <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"><Ionicons name="log-out-outline" size={21} color="#D4AF37" /></View>
            <View className="flex-1 ml-4">
              <Text className="text-base font-semibold text-amber-600">Logout</Text>
              <Text className="text-sm text-slate-400">Securely sign out of your account</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
