import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getMyProfile, updateCnicAddress } from '@/services/user_service';

export default function CnicAddressScreen() {
  const router = useRouter();
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [cnicFrontImage, setCnicFrontImage] = useState<string | null>(null);
  const [cnicBackImage, setCnicBackImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          router.replace('/login');
          return;
        }

        const { status, data } = await getMyProfile(token);
        if (status !== 200) {
          router.replace('/login');
          return;
        }

        setCnic(data.user.cnic ?? '');
        setAddress(data.user.address ?? '');
        setCnicFrontImage(data.user.cnic_front_image ?? null);
        setCnicBackImage(data.user.cnic_back_image ?? null);
        setLoading(false);
      };

      load();
    }, [router])
  );

  const handleSave = async () => {
    setErrors({});
    setSaving(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const { status, data } = await updateCnicAddress(token, cnic, address);

      if (status !== 200) {
        if (data.errors) setErrors(data.errors);
        else Alert.alert('Update failed', data.message || 'Something went wrong');
        return;
      }

      Alert.alert('Saved', 'Your CNIC and address have been updated.');
      router.back();
    } catch {
      Alert.alert('Network error', 'Could not reach the server. Check the backend is running and your phone is on the same WiFi.');
    } finally {
      setSaving(false);
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-[#0D1628]"
        contentContainerStyle={{ padding: 24, paddingTop: 64 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-white mb-1">CNIC & Address</Text>
        <Text className="text-base text-slate-400 mb-8">Identity and shop location</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-slate-300 mb-1">CNIC</Text>
          <TextInput
            value={cnic}
            onChangeText={setCnic}
            keyboardType="numeric"
            placeholder="3520112345671"
            className="border border-slate-600 rounded-xl px-4 py-3 text-base bg-slate-800 text-white"
          />
          {errors.cnic?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-slate-300 mb-1">Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Shop 5, Main Market, Karachi"
            className="border border-slate-600 rounded-xl px-4 py-3 text-base bg-slate-800 text-white"
          />
          {errors.address?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-slate-300 mb-1">CNIC Documents (Read-Only)</Text>
          <Text className="text-xs text-slate-400 mb-3">Front and back identity documents submitted during signup.</Text>

          <View className="gap-3">
            <View className="rounded-xl border border-slate-600 bg-slate-800 p-3">
              <Text className="text-xs font-semibold text-slate-300 mb-2">CNIC Front</Text>
              {cnicFrontImage ? (
                <Image
                  source={{ uri: cnicFrontImage }}
                  className="w-full h-44 rounded-lg bg-[#0D1628]"
                  resizeMode="contain"
                />
              ) : (
                <View className="h-28 rounded-lg bg-slate-700/40 items-center justify-center">
                  <Text className="text-xs text-slate-400">Not provided</Text>
                </View>
              )}
            </View>

            <View className="rounded-xl border border-slate-600 bg-slate-800 p-3">
              <Text className="text-xs font-semibold text-slate-300 mb-2">CNIC Back</Text>
              {cnicBackImage ? (
                <Image
                  source={{ uri: cnicBackImage }}
                  className="w-full h-44 rounded-lg bg-[#0D1628]"
                  resizeMode="contain"
                />
              ) : (
                <View className="h-28 rounded-lg bg-slate-700/40 items-center justify-center">
                  <Text className="text-xs text-slate-400">Not provided</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-amber-700 rounded-xl py-4 items-center"
        >
          {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold text-base">Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

