import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { getMyBookings, completeBooking, cancelAcceptedBooking } from '@/services/booking_service';

type Tab = 'accepted' | 'completed' | 'rejected' | 'cancelled';

interface Booking {
  id: string;
  services: { key: string; label: string; price: number }[];
  total_amount: number;
  status: string;
  customer_name: string;
  created_at: string;
  completed_at: string | null;
  cancelled_by: 'customer' | 'barber' | null;
  cancelled_at: string | null;
}

interface BarberBookingHistoryProps {
  title: string;
}

export function BarberBookingHistory({ title }: BarberBookingHistoryProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('accepted');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) return;

    const { status, data } = await getMyBookings(token);
    if (status === 200) {
      setBookings(data.bookings);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Booking', 'The customer didn\'t show up or you can\'t make it — cancel this booking?', [
        { text: 'No', style: 'cancel' },
        {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
            setCompletingId(id);
            try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;
            const { status, data } = await cancelAcceptedBooking(token, id);
            if (status !== 200) {
                Alert.alert('Failed', data.message || 'Could not cancel booking');
                return;
            }
            load();
            } finally {
            setCompletingId(null);
            }
        },
        },
    ]);
  };

  const handleComplete = (id: string) => {
    Alert.alert('Mark as Completed', 'Confirm this job is done?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setCompletingId(id);
          try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;
            const { status, data } = await completeBooking(token, id);
            if (status !== 200) {
              if (data?.code === 'WALLET_BLOCKED') {
                Alert.alert(
                  'Account Locked',
                  data.message || 'Your wallet balance cannot cover commission. Please settle dues to continue.',
                  [{ text: 'View Payment Details', onPress: () => router.replace('/wallet-locked') }]
                );
                return;
              }
              Alert.alert('Failed', data.message || 'Could not complete booking');
              return;
            }

            // Outcome messaging based on completion outcome: 'free' | 'deducted' | 'blocked'
            if (data.outcome === 'free') {
              Alert.alert(
                'Congratulations! 🎉',
                'Your first job completed! You keep 100% of earnings — platform commission is completely waived.'
              );
            } else if (data.outcome === 'deducted') {
              const comm = data.commission_amount !== undefined ? `PKR ${Number(data.commission_amount).toFixed(2)}` : 'Platform commission';
              const bal = data.wallet_balance !== undefined ? `PKR ${Number(data.wallet_balance).toFixed(2)}` : '';
              Alert.alert(
                'Job Completed! 🎉',
                `Booking marked as completed.\n${comm} deducted from your wallet balance.\nRemaining balance: ${bal}`
              );
            } else if (data.outcome === 'blocked') {
              const due = data.pending_commission_due !== undefined ? `PKR ${Number(data.pending_commission_due).toFixed(2)}` : 'the outstanding commission';
              Alert.alert(
                'Job Completed — Account Locked',
                `Booking marked as completed, but your wallet balance could not cover the platform commission.\n\nAmount owed: ${due}.\n\nPlease clear your pending dues to resume accepting and completing jobs.`,
                [
                  {
                    text: 'View Payment Details',
                    onPress: () => router.replace('/wallet-locked'),
                  },
                ]
              );
              return;
            } else {
              Alert.alert('Success', 'Booking marked as completed');
            }

            load();
          } finally {
            setCompletingId(null);
          }
        },
      },
    ]);
  };

  const filtered = bookings.filter((b) => b.status === tab);

  if (loading) {
    return (
      <View className="flex-1 bg-[#0D1628] items-center justify-center">
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0D1628]">
      <View className="px-5 pt-14 pb-5 bg-[#101B30] border-b border-slate-700"><Text className="text-xs tracking-[3px] text-amber-600 font-semibold">SALON AT HOME</Text><Text className="text-xl font-bold text-white mt-1">{title}</Text>
      </View>

      <View className="flex-row bg-[#101B30] border-b border-slate-700 px-4 pt-3 pb-1">
        {(['accepted', 'completed', 'rejected', 'cancelled'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            className={`flex-1 pb-2 items-center border-b-2 ${tab === t ? 'border-amber-600' : 'border-transparent'}`}
          >
            <Text className={`font-semibold capitalize ${tab === t ? 'text-amber-600' : 'text-slate-400'}`}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {filtered.length === 0 ? (
          <View className="items-center mt-12">
            <Ionicons name="cut-outline" size={40} color="#D4AF37" />
            <Text className="text-slate-400 mt-3">No {tab} bookings</Text>
          </View>
        ) : (
          filtered.map((b) => (
            <View key={b.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-4">
              <Text className="text-base font-bold text-white">{b.customer_name}</Text>

              {b.services.map((s) => (
                <View key={s.key} className="flex-row justify-between mt-2">
                  <Text className="text-sm text-slate-300">{s.label}</Text>
                  <Text className="text-sm text-slate-300">Rs. {s.price}</Text>
                </View>
              ))}

              <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-700">
                <Text className="text-sm font-semibold text-white">Total</Text>
                <Text className="text-sm font-semibold text-amber-600">Rs. {b.total_amount}</Text>
              </View>

              {tab === 'cancelled' && (
                <Text className="mt-3 text-sm text-red-400">
                  {b.cancelled_by === 'customer'
                    ? 'Cancelled by customer'
                    : b.cancelled_by === 'barber'
                      ? 'Cancelled by you'
                      : 'Booking cancelled'}
                </Text>
              )}

              {tab === 'accepted' && (
                <View className="flex-row gap-3 mt-4">
                    <TouchableOpacity
                    onPress={() => handleCancel(b.id)}
                    disabled={completingId === b.id}
                    className="flex-1 border border-red-500 rounded-xl py-3 items-center"
                    >
                    <Text className="text-red-500 font-semibold">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleComplete(b.id)}
                      disabled={completingId === b.id}
                      className="flex-1 bg-amber-700 rounded-xl py-3 items-center"
                      >
                        {completingId === b.id ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text className="text-white font-semibold">Mark as Completed</Text>
                        )}
                    </TouchableOpacity>
                </View>
                )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default function BookingsScreen() {
  return <BarberBookingHistory title="Bookings" />;
}
