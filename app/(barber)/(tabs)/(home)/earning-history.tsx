// app/(barber)/(tabs)/(home)/earning-history.tsx
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { EarningsPeriod, getEarningsHistory } from '@/services/booking_service';

const PERIODS: { label: string; value: EarningsPeriod }[] = [
  { label: 'Today', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Date Range', value: 'custom' },
];

function formatPeriodLabel(period: string, type: EarningsPeriod): string {
  if (type === 'daily' || type === 'custom') {
    const d = new Date(period);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (type === 'weekly') {
    const [year, week] = period.split('-');
    return `Week ${parseInt(week, 10)}, ${year}`;
  }
  const [year, month] = period.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function toApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createInitialStartDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return date;
}

function formatSelectedDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function EarningHistoryScreen() {
  const [period, setPeriod] = useState<EarningsPeriod>('daily');
  const [startDate, setStartDate] = useState(createInitialStartDate);
  const [endDate, setEndDate] = useState(() => new Date());
  const [pickerField, setPickerField] = useState<'start' | 'end' | null>(null);
  const [breakdown, setBreakdown] = useState<{ period: string; amount: number; jobs: number }[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (p: EarningsPeriod, from: Date, to: Date) => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const { status, data } = await getEarningsHistory(
        token,
        p,
        p === 'custom' ? toApiDate(from) : undefined,
        p === 'custom' ? toApiDate(to) : undefined,
      );
      if (status === 200) {
        setBreakdown(data.breakdown);
        setTotalBalance(data.total_balance);
        setTotalJobs(data.total_jobs);
      } else {
        setError(data.message || 'Unable to load earnings history');
      }
    } catch {
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(period, startDate, endDate);
    }, [endDate, load, period, startDate])
  );

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const field = pickerField;
    setPickerField(null);
    if (event.type === 'dismissed' || !selectedDate || !field) return;

    if (field === 'start') {
      setStartDate(selectedDate);
    } else {
      setEndDate(selectedDate);
    }
  };

  return (
    <View className="flex-1 bg-[#0D1628]">
      <View className="px-5 pt-14 pb-5 bg-[#101B30] border-b border-slate-700"><Text className="text-xs tracking-[3px] text-amber-600 font-semibold">SALON AT HOME</Text><Text className="text-xl font-bold text-white mt-1">Earning History</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="flex-row mb-6">
          <View className="flex-1 items-center mr-2 rounded-3xl border border-slate-700 bg-slate-800 p-5">
            <Text className="text-xs tracking-wider text-slate-400 mb-2">TOTAL BALANCE</Text>
            <Text adjustsFontSizeToFit className="text-2xl font-bold text-amber-600" numberOfLines={1}>
              Rs. {totalBalance}
            </Text>
          </View>
          <View className="flex-1 items-center ml-2 rounded-3xl border border-slate-700 bg-slate-800 p-5">
            <Text className="text-xs tracking-wider text-slate-400 mb-2">TOTAL JOBS</Text>
            <Text className="text-2xl font-bold text-white">{totalJobs}</Text>
          </View>
        </View>

        <View className="flex-row bg-slate-800 rounded-2xl p-1 mb-6 border border-slate-700">
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.value}
              onPress={() => setPeriod(p.value)}
              className={`flex-1 py-3 rounded-lg items-center ${period === p.value ? 'bg-amber-700' : ''}`}
            >
              <Text
                adjustsFontSizeToFit
                className={`font-semibold ${period === p.value ? 'text-[#1B263B]' : 'text-slate-400'}`}
                numberOfLines={1}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {period === 'custom' && (
          <View className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-6">
            <Text className="text-xs tracking-widest text-slate-400 mb-3">SELECT DATE RANGE</Text>
            <View className="flex-row">
              <TouchableOpacity
                accessibilityLabel="Select starting date"
                className="flex-1 mr-2 rounded-xl border border-slate-600 p-3"
                onPress={() => setPickerField('start')}
              >
                <Text className="text-xs text-slate-400 mb-1">Starting date</Text>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={18} color="#D4AF37" />
                  <Text className="text-white ml-2 font-semibold">{formatSelectedDate(startDate)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Select ending date"
                className="flex-1 ml-2 rounded-xl border border-slate-600 p-3"
                onPress={() => setPickerField('end')}
              >
                <Text className="text-xs text-slate-400 mb-1">Ending date</Text>
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={18} color="#D4AF37" />
                  <Text className="text-white ml-2 font-semibold">{formatSelectedDate(endDate)}</Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-slate-500 mt-3">History updates automatically for the selected dates.</Text>
          </View>
        )}

        {pickerField && (
          <DateTimePicker
            value={pickerField === 'start' ? startDate : endDate}
            mode="date"
            maximumDate={pickerField === 'start' ? endDate : new Date()}
            minimumDate={pickerField === 'end' ? startDate : undefined}
            onChange={handleDateChange}
          />
        )}

        <View className="bg-slate-800 rounded-2xl border border-slate-700 mb-6">
          {loading ? (
            <View className="p-6 items-center">
              <ActivityIndicator color="#D4AF37" />
            </View>
          ) : error ? (
            <View className="p-6 items-center">
              <Ionicons name="alert-circle-outline" size={32} color="#F59E0B" />
              <Text className="text-slate-400 mt-2 text-center">{error}</Text>
            </View>
          ) : breakdown.length === 0 ? (
            <View className="p-6 items-center">
              <Ionicons name="cash-outline" size={32} color="#D4AF37" />
              <Text className="text-slate-400 mt-2">
                {period === 'daily'
                  ? 'No earnings today'
                  : period === 'custom'
                    ? 'No earnings in this date range'
                    : `No ${period} earnings yet`}
              </Text>
            </View>
          ) : (
            breakdown.map((item, idx) => (
              <View
                key={item.period}
                className={`flex-row items-center justify-between px-4 py-3 ${idx !== breakdown.length - 1 ? 'border-b border-slate-700' : ''}`}
              >
                <View>
                  <Text className="text-white">{formatPeriodLabel(item.period, period)}</Text>
                  <Text className="text-xs text-slate-400">{item.jobs} job{item.jobs > 1 ? 's' : ''}</Text>
                </View>
                <Text className="text-amber-600 font-semibold">Rs. {item.amount}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}
