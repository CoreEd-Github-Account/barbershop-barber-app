// app/(barber)/(tabs)/(home)/index.tsx
import { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getMyProfile, updateAvailability } from '@/services/user_service';
import { getCustomerCancellations, getIncomingRequests, getTodayStats } from '@/services/booking_service';
import SalonLoadingScreen from '@/components/salon-loading-screen';
import { notifyAboutCustomerCancellations, notifyAboutNewBookings } from '@/services/notification_service';

interface DashboardData {
  name: string;
  is_online: boolean;
  wallet_balance: number;
}

export default function BarberDashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayJobs, setTodayJobs] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);

  const seenRequestIds = useRef<Set<string> | null>(null);
  const seenCancellationIds = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    const { status, data: res } = await getMyProfile(token);

    if (status !== 200) {
      router.replace('/login');
      return;
    }

    if (res.user.is_wallet_blocked) {
      router.replace('/wallet-locked');
      return;
    }

    setData({
      name: res.user.name,
      is_online: res.user.is_online,
      wallet_balance: res.user.wallet_balance ?? 0,
    });
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useFocusEffect(
    useCallback(() => {
      const checkCancellations = async () => {
        const token = await SecureStore.getItemAsync('token');
        if (!token) return;

        const { status, data: response } = await getCustomerCancellations(token);
        if (status !== 200) return;

        const cancellations = response.cancellations as { id: string; customer_name: string }[];
        const currentIds = cancellations.map((cancellation) => cancellation.id);

        if (seenCancellationIds.current === null) {
          seenCancellationIds.current = new Set(currentIds);
          return;
        }

        const newCancellations = cancellations.filter(
          (cancellation) => !seenCancellationIds.current!.has(cancellation.id),
        );
        seenCancellationIds.current = new Set(currentIds);

        if (newCancellations.length === 0) return;

        try {
          await notifyAboutCustomerCancellations(newCancellations.length);
        } catch (error) {
          console.warn('Unable to play the customer cancellation notification', error);
        }

        const message = newCancellations.length === 1
          ? `${newCancellations[0].customer_name} cancelled the booking you accepted.`
          : `${newCancellations.length} customers cancelled bookings you accepted.`;
        Alert.alert('Booking Cancelled', message);
      };

      checkCancellations();
      const interval = setInterval(checkCancellations, 5000);
      return () => clearInterval(interval);
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        const token = await SecureStore.getItemAsync('token');
        if (!token) return;

        const statsRes = await getTodayStats(token);

        if (statsRes.status === 200) {
          setTodayJobs(statsRes.data.jobs_count);
          setTodayIncome(statsRes.data.total_income);
        }
      };

      loadStats();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const checkRequests = async () => {
        const token = await SecureStore.getItemAsync('token');
        if (!token) return;

        const { status, data: res } = await getIncomingRequests(token);
        if (status !== 200) return;

        const currentIds: string[] = res.requests.map((r: { id: string }) => r.id);

        if (seenRequestIds.current === null) {
          seenRequestIds.current = new Set(currentIds);
        } else {
          const newOnes = currentIds.filter((id) => !seenRequestIds.current!.has(id));

          if (newOnes.length > 0) {
            try {
              await notifyAboutNewBookings(newOnes.length);
            } catch (error) {
              console.warn('Unable to play the booking request notification', error);
            }
          }

          seenRequestIds.current = new Set(currentIds);
        }

        setPendingCount(currentIds.length);
      };

      checkRequests();
      const interval = setInterval(checkRequests, 5000);
      return () => clearInterval(interval);
    }, [])
  );

  const handleToggle = async () => {
    if (!data) return;
    setToggling(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const newStatus = !data.is_online;

      if (newStatus) {
        const { status: permStatus } = await Location.requestForegroundPermissionsAsync();

        if (permStatus !== 'granted') {
          Alert.alert('Location required', 'We need your location so customers can find you while online.');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { status, data: res } = await updateAvailability(token, true, location.coords.latitude, location.coords.longitude);

        if (status !== 200) {
          if (res?.code === 'WALLET_BLOCKED') {
            Alert.alert(
              'Account Locked',
              res.message || 'Your wallet balance is insufficient to go online. Please settle your dues to continue.',
              [{ text: 'View Payment Details', onPress: () => router.replace('/wallet-locked') }]
            );
            return;
          }
          Alert.alert('Failed', res.message || 'Could not update availability');
          return;
        }

        setData({ ...data, is_online: res.is_online });
      } else {
        const { status, data: res } = await updateAvailability(token, false);

        if (status !== 200) {
          if (res?.code === 'WALLET_BLOCKED') {
            Alert.alert(
              'Account Locked',
              res.message || 'Your wallet balance is insufficient. Please settle your dues to continue.',
              [{ text: 'View Payment Details', onPress: () => router.replace('/wallet-locked') }]
            );
            return;
          }
          Alert.alert('Failed', res.message || 'Could not update availability');
          return;
        }

        setData({ ...data, is_online: res.is_online });
      }
    } catch {
      Alert.alert('Network error', 'Could not reach the server. Check the backend is running and your phone is on the same WiFi.');
    } finally {
      setToggling(false);
    }
  };

  if (loading || !data) {
    return <SalonLoadingScreen />;
  }

  return (
    <View className="flex-1 bg-[#0D1628]">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-5 border-b border-slate-700 bg-[#101B30]">
        <View>
          <Text className="text-xs tracking-[3px] text-amber-600 font-semibold">SALON AT HOME</Text>
          <Text className="text-xl font-bold text-white mt-1">Hello, {data.name.split(' ')[0]}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Notifications', 'Coming soon')}>
          <View className="w-11 h-11 rounded-full border border-slate-600 bg-slate-800 items-center justify-center"><Ionicons name="notifications-outline" size={23} color="#D4AF37" /></View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="items-center mb-5 rounded-3xl border border-slate-700 bg-slate-800/80 p-6" style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
          <View className="flex-row items-center self-start mb-2"><View className={`w-2.5 h-2.5 rounded-full mr-2 ${data.is_online ? 'bg-emerald-400' : 'bg-slate-500'}`} /><Text className="text-xs tracking-widest text-slate-400">AVAILABILITY</Text></View>
          <Text className="text-base text-slate-300 mb-5 self-start">
            {data.is_online ? 'Go offline when you\'re done for the day' : 'Go online to start receiving jobs'}
          </Text>

          <TouchableOpacity
            onPress={handleToggle}
            disabled={toggling}
            className={`w-28 h-28 rounded-full border-4 items-center justify-center ${data.is_online ? 'bg-emerald-500 border-emerald-300' : 'bg-amber-700 border-amber-300'}`}
            style={{ elevation: 6, shadowColor: data.is_online ? '#34D399' : '#D4AF37', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }}
          >
            {toggling ? <ActivityIndicator color="white" /> : <Ionicons name="power" size={48} color="white" />}
          </TouchableOpacity>

          <Text className={`text-lg font-semibold mt-4 ${data.is_online ? 'text-emerald-400' : 'text-amber-600'}`}>
            {data.is_online ? 'You are online 😊' : 'You are offline 😔'}
          </Text>

          {pendingCount > 0 && (
            <TouchableOpacity
              onPress={() => router.push('/requests')}
              className="bg-amber-700 rounded-2xl p-4 flex-row items-center justify-between w-full mt-5"
            >
              <Text className="text-white font-semibold">
                New booking request{pendingCount > 1 ? 's' : ''}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Wallet Balance Card */}
        <View className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-11 h-11 rounded-xl bg-amber-700/15 border border-amber-600/30 items-center justify-center mr-3">
              <Ionicons name="wallet-outline" size={22} color="#D4AF37" />
            </View>
            <View>
              <Text className="text-[11px] font-semibold tracking-wider text-slate-400">WALLET BALANCE</Text>
              <Text className="text-xl font-bold text-white mt-0.5">PKR {data.wallet_balance.toFixed(2)}</Text>
            </View>
          </View>
          <View className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-emerald-400">Active</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <Ionicons name="cut-outline" size={22} color="#D4AF37" />
            <Text className="text-xs text-slate-400 mt-3 mb-1">TODAY&apos;S JOBS</Text>
            <Text className="text-lg font-bold text-white">{todayJobs} <Text className="text-sm font-normal text-slate-400">completed</Text></Text>
          </View>
          <View className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <Ionicons name="cash-outline" size={22} color="#D4AF37" />
            <Text className="text-xs text-slate-400 mt-3 mb-1">TODAY&apos;S EARNING</Text>
            <Text className="text-lg font-bold text-white">Rs. {todayIncome}</Text>
          </View>
        </View>

        <View className="pb-10">
          <TouchableOpacity
            onPress={() => router.push('/bookings')}
            className="min-h-28 rounded-3xl border border-slate-700 bg-slate-800 p-5 mb-4 flex-row items-center"
            style={{ elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}
          >
            <View className="w-14 h-14 rounded-2xl bg-amber-700/15 border border-amber-600/30 items-center justify-center">
              <Ionicons name="calendar-outline" size={27} color="#D4AF37" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg text-white font-bold">Booking History</Text>
              <Text className="text-sm text-slate-400 mt-1">Review accepted, completed, and rejected bookings.</Text>
            </View>
            <View className="w-9 h-9 rounded-full bg-slate-700 items-center justify-center ml-3">
              <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/earning-history')}
            className="min-h-28 rounded-3xl border border-slate-700 bg-slate-800 p-5 flex-row items-center"
            style={{ elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}
          >
            <View className="w-14 h-14 rounded-2xl bg-amber-700/15 border border-amber-600/30 items-center justify-center">
              <Ionicons name="cash-outline" size={27} color="#D4AF37" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg text-white font-bold">Earning History</Text>
              <Text className="text-sm text-slate-400 mt-1">Track earnings and completed jobs by date.</Text>
            </View>
            <View className="w-9 h-9 rounded-full bg-slate-700 items-center justify-center ml-3">
              <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
