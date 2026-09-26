// app/(barber)/(tabs)/profile/bank-details/add.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { addBankAccount } from '@/services/user_service';

const BANK_TYPES = [
  { label: 'Bank', value: 'bank' },
  { label: 'Easypaisa', value: 'easypaisa' },
  { label: 'JazzCash', value: 'jazzcash' },
  { label: 'NayaPay', value: 'nayapay' },
  { label: 'SadaPay', value: 'sadapay' },
];

export default function AddBankAccountScreen() {
  const router = useRouter();
  const [bankType, setBankType] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setErrors({});
    setSaving(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const { status, data } = await addBankAccount(
        token,
        bankType,
        bankType === 'bank' ? bankName : undefined,
        accountTitle,
        accountNumber
      );

      if (status !== 201) {
        if (data.errors) setErrors(data.errors);
        else Alert.alert('Failed', data.message || 'Something went wrong');
        return;
      }

      router.back();
    } catch (err) {
      Alert.alert('Network error', 'Could not reach the server. Check the backend is running and your phone is on the same WiFi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-[#0D1628]"
        contentContainerStyle={{ padding: 20, paddingTop: 56 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-xs font-bold tracking-[3px] text-[#D4AF37] mb-2">SALON AT HOME</Text>
        <Text className="text-3xl font-bold text-white mb-1">Add Bank Account</Text>
        <Text className="text-base text-slate-400 mb-8">Add a new payout account</Text>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-slate-200 mb-3">Bank Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {BANK_TYPES.map((b) => (
              <TouchableOpacity
                key={b.value}
                onPress={() => { setBankType(b.value); if (b.value !== 'bank') setBankName(''); }}
                className={`px-4 py-2 rounded-full border ${
                  bankType === b.value ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-slate-800 border-slate-600'
                }`}
              >
                <Text className={bankType === b.value ? 'text-[#1B263B] font-semibold' : 'text-slate-200'}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.bank_type?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        {bankType === 'bank' && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-200 mb-2">Bank Name</Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. HBL, Meezan Bank"
              placeholderTextColor="#94A3B8"
              className="border border-slate-600 rounded-2xl px-4 py-3.5 text-base bg-slate-800 text-white"
            />
            {errors.bank_name?.map((msg) => (
              <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
            ))}
          </View>
        )}

        <View className="mb-4">
          <Text className="text-sm font-semibold text-slate-200 mb-2">Account Title</Text>
          <TextInput
            value={accountTitle}
            onChangeText={setAccountTitle}
            placeholder="Name on the account"
            placeholderTextColor="#94A3B8"
            className="border border-slate-600 rounded-2xl px-4 py-3.5 text-base bg-slate-800 text-white"
          />
          {errors.account_title?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-slate-200 mb-2">Account Number</Text>
          <TextInput
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            placeholder="Enter account number"
            placeholderTextColor="#94A3B8"
            className="border border-slate-600 rounded-2xl px-4 py-3.5 text-base bg-slate-800 text-white"
          />
          {errors.account_number?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-[#D4AF37] rounded-2xl py-4 items-center"
        >
          {saving ? <ActivityIndicator color="#1B263B" /> : <Text className="text-[#1B263B] font-bold text-base">Add Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
