import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { resetPassword } from '../../../services/reset_password_service';
import PasswordInput from '@/components/password-input';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [mobileNo, setMobileNo] = useState('');
  const [cnic, setCnic] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setErrors({});

    if (newPassword !== confirmPassword) {
      setErrors({ confirm_password: ['Passwords do not match'] });
      return;
    }

    setLoading(true);

    try {
      const { status, data } = await resetPassword(mobileNo, cnic, newPassword);

      if (status !== 200) {
        if (data.errors) setErrors(data.errors);
        else Alert.alert('Reset failed', data.message || 'Something went wrong');
        return;
      }

      Alert.alert('Success', 'Your password has been reset. Please log in.');
      router.replace('/login');
    } catch (err) {
      Alert.alert('Network error', 'Could not reach the server. Check the backend is running and your phone is on the same WiFi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1 bg-neutral-50"
        contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-neutral-900 mb-1">Reset Password</Text>
        <Text className="text-base text-neutral-500 mb-8">
          For barbers only — enter your mobile number and CNIC to reset your password
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-1">Mobile Number</Text>
          <TextInput
            value={mobileNo}
            onChangeText={setMobileNo}
            keyboardType="phone-pad"
            placeholder="03001234567"
            className="border border-neutral-300 rounded-xl px-4 py-3 text-base bg-white"
          />
          {errors.mobile_no?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-neutral-700 mb-1">CNIC</Text>
          <TextInput
            value={cnic}
            onChangeText={setCnic}
            keyboardType="numeric"
            placeholder="3520112345671"
            className="border border-neutral-300 rounded-xl px-4 py-3 text-base bg-white"
          />
          {errors.cnic?.map((msg) => (
            <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
          ))}
        </View>

        <PasswordInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="••••••••"
          errors={errors.new_password}
        />

        <PasswordInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          errors={errors.confirm_password}
        />

        <TouchableOpacity
          onPress={handleReset}
          disabled={loading}
          className="bg-amber-700 rounded-xl py-4 items-center mb-4 mt-2"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold text-base">Reset Password</Text>}
        </TouchableOpacity>

        <Link href="/login" asChild>
          <TouchableOpacity>
            <Text className="text-center text-neutral-600">
              Remember your password? <Text className="text-amber-600 font-semibold">Log in</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}