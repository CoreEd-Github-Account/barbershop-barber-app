// app/(barber)/profile/bank-details/index.tsx
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { getBankAccounts, deleteBankAccount } from '@/services/user_service';

const BANK_LABELS: Record<string, string> = {
  bank: 'Bank',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
  nayapay: 'NayaPay',
  sadapay: 'SadaPay',
};

interface BankAccount {
  id: string;
  bank_type: string;
  bank_name: string | null;
  account_title: string | null;
  account_number: string;
}

export default function BankDetailsListScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    const { status, data } = await getBankAccounts(token);
    if (status === 200) setAccounts(data.bank_accounts);
    setLoading(false);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts])
  );

  const handleDelete = (id: string) => {
    Alert.alert('Delete account', 'Are you sure you want to remove this bank account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const token = await SecureStore.getItemAsync('token');
          if (!token) return;
          await deleteBankAccount(token, id);
          loadAccounts();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0D1628] items-center justify-center">
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0D1628] px-5 pt-14">
      <Text className="text-xs font-bold tracking-[3px] text-[#D4AF37] mb-2">SALON AT HOME</Text>
      <Text className="text-3xl font-bold text-white mb-1">Bank Details</Text>
      <Text className="text-base text-slate-400 mb-6">Manage your payout accounts</Text>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="items-center justify-center flex-1 pt-20">
            <View className="w-14 h-14 rounded-full bg-slate-800 items-center justify-center mb-4">
              <Ionicons name="wallet-outline" size={27} color="#D4AF37" />
            </View>
            <Text className="text-slate-400 text-center">No payout accounts added yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex-row items-center justify-between">
            <View>
              <Text className="text-base font-semibold text-white">
                {item.bank_type === 'bank' && item.bank_name ? item.bank_name : BANK_LABELS[item.bank_type]}
              </Text>
              <Text className="text-sm text-slate-300 mt-1">{item.account_title || 'Account title not provided'}</Text>
              <Text className="text-sm text-slate-400 mt-1">{item.account_number}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={22} color="#dc2626" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        onPress={() => router.push('/profile/bank-details/add')}
        className="bg-[#D4AF37] rounded-2xl py-4 items-center mt-4 mb-16"
      >
        <Text className="text-[#1B263B] font-bold text-base">+ Add New Account</Text>
      </TouchableOpacity>
    </View>
  );
}
