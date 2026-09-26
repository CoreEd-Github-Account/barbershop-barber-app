import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { getMyProfile, updateMyProfile } from '@/services/user_service';

const GENDERS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
] as const;

type Gender = (typeof GENDERS)[number]['value'];

export default function PersonalInformationScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
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

        setName(data.user.name);
        setEmail(data.user.email ?? '');
        setMobileNo(data.user.mobile_no);
        setGender(GENDERS.some((option) => option.value === data.user.gender) ? data.user.gender : '');
        setCnicFrontImage(data.user.cnic_front_image ?? null);
        setCnicBackImage(data.user.cnic_back_image ?? null);
        setLoading(false);
      };

      load();
    }, [router])
  );

  const handleSave = async () => {
    setErrors({});

    if (!gender) {
      setErrors({ gender: ['Select your gender'] });
      return;
    }

    setSaving(true);

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const { status, data } = await updateMyProfile(token, name, email, mobileNo, gender);

      if (status !== 200) {
        if (data.errors) setErrors(data.errors);
        else Alert.alert('Update failed', data.message || 'Something went wrong');
        return;
      }

      Alert.alert('Saved', 'Your personal information has been updated.');
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
        <Text className="text-2xl font-bold text-white mb-1">Personal Information</Text>
        <Text className="text-base text-slate-400 mb-8">Manage your name, gender, email & phone</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-slate-300 mb-1">Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="border border-slate-600 rounded-xl px-4 py-3 text-base bg-slate-800 text-white"
          />
          {errors.name?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-slate-300 mb-2">Gender</Text>
          <View className="flex-row gap-2">
            {GENDERS.map((option) => (
              <TouchableOpacity
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: gender === option.value }}
                onPress={() => setGender(option.value)}
                className={`flex-1 items-center rounded-xl border px-3 py-3 ${gender === option.value ? 'border-amber-600 bg-amber-700' : 'border-slate-600 bg-slate-800'}`}
              >
                <Text className={`text-sm font-medium ${gender === option.value ? 'text-[#1B263B]' : 'text-slate-300'}`}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.gender?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-slate-300 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className="border border-slate-600 rounded-xl px-4 py-3 text-base bg-slate-800 text-white"
          />
          {errors.email?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        <View className="mb-2">
          <Text className="text-sm font-medium text-slate-300 mb-1">Mobile Number</Text>
          <TextInput
            value={mobileNo}
            onChangeText={setMobileNo}
            keyboardType="phone-pad"
            className="border border-slate-600 rounded-xl px-4 py-3 text-base bg-slate-800 text-white"
          />
          {errors.mobile_no?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>
        <Text className="text-xs text-slate-400 mb-6">Changing this updates your login mobile number too.</Text>

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
