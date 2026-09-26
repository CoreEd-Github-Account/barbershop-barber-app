// app/(barber)/(tabs)/(home)/requests.tsx
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import {
  getIncomingRequests,
  acceptBooking,
  rejectBooking,
  getMyBookings,
  IncomingBookingRequest,
} from '@/services/booking_service';

type BookingRequest = IncomingBookingRequest;

export default function RequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) return;

    try {
      const [reqRes, myBookingsRes] = await Promise.all([
        getIncomingRequests(token),
        getMyBookings(token),
      ]);

      if (reqRes.status === 200) {
        setRequests(reqRes.data.requests);
      }
      if (myBookingsRes.status === 200 && Array.isArray(myBookingsRes.data?.bookings)) {
        const active = myBookingsRes.data.bookings.some((b: { status: string }) => b.status === 'accepted');
        setHasActiveBooking(active);
      }
    } catch {
      // Ignore background network polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(load, 5000);
      return () => clearInterval(interval);
    }, [load])
  );

  const handleAccept = async (id: string) => {
    if (hasActiveBooking) {
      Alert.alert(
        'Active Job In Progress',
        'You already have an active booking in progress. Complete or cancel your current job before accepting another.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Active Job', onPress: () => router.push('/bookings') },
        ]
      );
      return;
    }

    setRespondingId(id);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const { status, data } = await acceptBooking(token, id);
      if (status !== 200) {
        if (data?.code === 'WALLET_BLOCKED') {
          Alert.alert(
            'Account Locked',
            data.message || 'Your wallet balance is insufficient to accept bookings. Please settle your dues to continue.',
            [{ text: 'View Payment Details', onPress: () => router.replace('/wallet-locked') }]
          );
          return;
        }
        if (data?.code === 'ACTIVE_BOOKING_EXISTS') {
          setHasActiveBooking(true);
          Alert.alert(
            'Active Job In Progress',
            data.message || 'You already have an active booking in progress. Complete or cancel it before accepting another.',
            [
              { text: 'OK', style: 'cancel' },
              { text: 'View Active Job', onPress: () => router.push('/bookings') },
            ]
          );
          load();
          return;
        }
        Alert.alert('Cannot Accept', data?.message || 'Could not accept booking');
        load();
        return;
      }
      load();
    } finally {
      setRespondingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setRespondingId(id);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const { status, data } = await rejectBooking(token, id);
      if (status !== 200) {
        if (data?.code === 'WALLET_BLOCKED') {
          Alert.alert(
            'Account Locked',
            data.message || 'Your wallet balance is insufficient. Please settle your dues to continue.',
            [{ text: 'View Payment Details', onPress: () => router.replace('/wallet-locked') }]
          );
          return;
        }
        Alert.alert('Failed', data?.message || 'Could not reject booking');
        return;
      }
      load();
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0D1628] items-center justify-center">
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0D1628]">
      <View className="px-5 pt-14 pb-5 bg-[#101B30] border-b border-slate-700">
        <Text className="text-xs tracking-[3px] text-amber-600 font-semibold">SALON AT HOME</Text>
        <Text className="text-xl font-bold text-white mt-1">Booking Requests</Text>
      </View>

      {/* Persistent Active Job Banner */}
      {hasActiveBooking && (
        <View className="mx-6 mt-4 p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 items-center justify-center mr-3">
              <Ionicons name="briefcase-outline" size={18} color="#D4AF37" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-amber-300">Active Job In Progress</Text>
              <Text className="text-xs text-amber-200/70 mt-0.5" numberOfLines={2}>
                Complete or cancel your current job to accept new requests.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/bookings')}
            className="bg-amber-600 px-3 py-2 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-xs font-bold text-slate-950">View Job</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {requests.length === 0 ? (
          <View className="items-center mt-12">
            <Ionicons name="notifications-outline" size={40} color="#D4AF37" />
            <Text className="text-slate-400 mt-3">No pending requests</Text>
          </View>
        ) : (
          requests.map((req) => (
            <View key={req.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-4">
              <Text className="text-base font-bold text-white">{req.customer_name}</Text>
              <Text className="text-sm text-slate-400 mb-3">{req.customer_mobile}</Text>

              {/* Distance & Estimated Travel Time */}
              <View className="mb-3 flex-row items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2.5">
                <View className="flex-row items-center flex-1 mr-2">
                  <Ionicons name="navigate-circle-outline" size={17} color="#D4AF37" />
                  <Text className="ml-1.5 text-sm font-medium text-slate-200">
                    {req.distance_km !== null
                      ? `${req.distance_km.toFixed(1)} km away`
                      : 'Distance unknown'}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={req.estimated_minutes !== null ? "#D4AF37" : "#94A3B8"}
                  />
                  <Text
                    className={`ml-1 text-sm font-semibold ${
                      req.estimated_minutes !== null ? 'text-amber-500' : 'text-slate-400'
                    }`}
                  >
                    {req.estimated_minutes !== null
                      ? `~${req.estimated_minutes} min`
                      : 'ETA unknown'}
                  </Text>
                </View>
              </View>

              <View className="mb-3 flex-row items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2">
                <Text className="text-sm text-slate-300">{req.number_of_persons} {req.number_of_persons === 1 ? 'person' : 'people'}</Text>
                {req.customer_latitude !== null && req.customer_longitude !== null ? (
                  <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${req.customer_latitude},${req.customer_longitude}`)} className="flex-row items-center">
                    <Ionicons name="navigate-outline" size={16} color="#D4AF37" />
                    <Text className="ml-1 text-sm font-semibold text-amber-500">View location</Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-xs text-slate-500">Location unshared</Text>
                )}
              </View>


              {req.services.map((s) => (
                <View key={s.key} className="flex-row justify-between mb-1">
                  <Text className="text-sm text-slate-300">{s.label}</Text>
                  <Text className="text-sm text-slate-300">Rs. {s.price}</Text>
                </View>
              ))}

              <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-700">
                <Text className="text-sm font-semibold text-white">Total</Text>
                <Text className="text-sm font-semibold text-amber-600">Rs. {req.total_amount}</Text>
              </View>

              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={() => handleReject(req.id)}
                  disabled={respondingId === req.id}
                  className="flex-1 border border-red-500 rounded-xl py-3 items-center"
                >
                  <Text className="text-red-500 font-semibold">Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAccept(req.id)}
                  disabled={respondingId === req.id}
                  className={`flex-1 rounded-xl py-3 items-center ${
                    hasActiveBooking
                      ? 'bg-slate-700/60 border border-slate-600/60'
                      : 'bg-amber-700'
                  }`}
                >
                  {respondingId === req.id ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <View className="flex-row items-center">
                      {hasActiveBooking && (
                        <Ionicons name="lock-closed-outline" size={14} color="#94A3B8" style={{ marginRight: 4 }} />
                      )}
                      <Text
                        className={`font-semibold ${
                          hasActiveBooking ? 'text-slate-400' : 'text-white'
                        }`}
                      >
                        {hasActiveBooking ? 'Accept (Busy)' : 'Accept'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
