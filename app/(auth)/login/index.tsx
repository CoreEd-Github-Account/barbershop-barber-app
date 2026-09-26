import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '../../../services/login_service';

const CUSTOMER_APP_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.barbershop.customer';

export default function LoginScreen() {
  const router = useRouter();
  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const restoreSavedCredentials = async () => {
      const [savedMobileNo, savedPreference] = await Promise.all([
        SecureStore.getItemAsync('remembered_mobile_no'),
        SecureStore.getItemAsync('remember_me_enabled'),
        SecureStore.deleteItemAsync('remembered_password'),
      ]);

      if (savedPreference === 'true' && savedMobileNo) {
        setMobileNo(savedMobileNo);
        setRememberMe(true);
      }
    };

    restoreSavedCredentials();
  }, []);

  const handleLogin = async () => {
    setErrors({});
    setLoading(true);

    try {
      const { status, data } = await loginUser(mobileNo, password);

      if (status !== 200) {
        if (data.errors) setErrors(data.errors);
        else Alert.alert('Login failed', data.message || 'Something went wrong');
        return;
      }

      if (data.user.role !== 'barber') {
        Alert.alert('Barber account required', 'Please use the BarberShop Customer app to sign in as a customer.');
        return;
      }

      await SecureStore.setItemAsync('token', data.token);
      await SecureStore.setItemAsync('role', data.user.role);

      if (rememberMe) {
        await Promise.all([
          SecureStore.setItemAsync('remembered_mobile_no', mobileNo),
          SecureStore.setItemAsync('remember_me_enabled', 'true'),
          SecureStore.deleteItemAsync('remembered_password'),
        ]);
      } else {
        await Promise.all([
          SecureStore.deleteItemAsync('remembered_mobile_no'),
          SecureStore.deleteItemAsync('remembered_password'),
          SecureStore.deleteItemAsync('remember_me_enabled'),
        ]);
      }

      router.replace('/');
    } catch {
      Alert.alert('Network error', 'Could not reach the server. Check the backend is running and your phone is on the same WiFi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ImageBackground source={require('../../../assets/images/background-image.jpeg')} blurRadius={10} resizeMode="cover" style={{ flex: 1 }}>
        <View className="absolute inset-0 bg-[#0D1628]/90" />
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 50, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <View className="items-center mb-4">
            <Image source={require('../../../assets/images/logo-transparent.png')} resizeMode="contain" className="w-40 h-40" />
          </View>

          <View className="items-center mb-5">
            <Text className="text-2xl font-bold text-white">Welcome <Text className="text-amber-600">to Barber Login!</Text></Text>
            <Text className="text-xs text-slate-300 mt-1.5">Log in to manage your barber services</Text>
          </View>

          <View className="mb-2 rounded-2xl border border-slate-600 bg-slate-800/80 flex-row items-center px-4" style={{ minHeight: 60 }}>
            <Ionicons name="phone-portrait-outline" size={22} color="#D4AF37" />
            <View className="flex-1 ml-4">
              <Text className="text-sm text-slate-400 mb-1">Mobile Number</Text>
              <TextInput value={mobileNo} onChangeText={setMobileNo} keyboardType="phone-pad" placeholder="03001234567" placeholderTextColor="#94A3B8" className="text-lg text-white py-0" />
            </View>
          </View>
          {errors.mobile_no?.map((message) => <Text key={message} className="text-red-300 text-xs mb-3">{message}</Text>)}

          <View className="mb-2 rounded-2xl border border-slate-600 bg-slate-800/80 flex-row items-center px-4" style={{ minHeight: 60 }}>
            <Ionicons name="lock-closed-outline" size={22} color="#D4AF37" />
            <View className="flex-1 ml-4">
              <Text className="text-sm text-slate-400 mb-1">Password</Text>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} placeholder="Enter your password" placeholderTextColor="#94A3B8" autoCapitalize="none" className="text-lg text-white py-0" />
            </View>
            <TouchableOpacity onPress={() => setPasswordVisible((visible) => !visible)} className="p-2">
              <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={24} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
          {errors.password?.map((message) => <Text key={message} className="text-red-300 text-xs mb-3">{message}</Text>)}

          <View className="flex-row items-center justify-between mb-4 mt-1">
            <TouchableOpacity onPress={() => setRememberMe((selected) => !selected)} className="flex-row items-center">
              <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={26} color="#D4AF37" />
              <Text className="text-slate-300 text-base ml-2">Remember mobile number</Text>
            </TouchableOpacity>
            <Link href="/forgot-password" asChild><TouchableOpacity><Text className="text-amber-600 text-base font-medium">Forgot password?</Text></TouchableOpacity></Link>
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={loading} className="bg-amber-700 rounded-2xl py-3.5 flex-row justify-center items-center">
            {loading ? <ActivityIndicator color="#1B263B" /> : <><Text className="text-[#1B263B] font-bold text-xl">Log In</Text><Ionicons name="arrow-forward" size={26} color="#1B263B" style={{ marginLeft: 12 }} /></>}
          </TouchableOpacity>

          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-slate-600" />
            <Ionicons name="cut-outline" size={24} color="#D4AF37" style={{ marginHorizontal: 16 }} />
            <View className="flex-1 h-px bg-slate-600" />
          </View>

          <View className="rounded-2xl border border-slate-600 bg-slate-800/70 p-3.5 flex-row items-center mb-3">
            <Ionicons name="shield-checkmark-outline" size={30} color="#D4AF37" />
            <View className="flex-1 ml-4"><Text className="text-white text-lg font-semibold">Your privacy matters</Text><Text className="text-slate-400 text-sm mt-1">Your information stays secure and private.</Text></View>
          </View>

          <Link href="/signup" asChild>
            <TouchableOpacity className="rounded-2xl border border-slate-600 bg-slate-800/70 py-5 px-5 flex-row items-center justify-center">
              <Text className="text-white text-lg">Don&apos;t have an account?</Text><Text className="text-amber-600 text-lg font-semibold ml-3">Sign up</Text><Ionicons name="arrow-forward" size={24} color="#D4AF37" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            onPress={() => Linking.openURL(CUSTOMER_APP_PLAY_STORE_URL)}
            className="mt-5 flex-row items-center justify-center"
          >
            <Ionicons name="phone-portrait-outline" size={18} color="#D4AF37" />
            <Text className="text-slate-300 text-sm ml-2">Want to book a service?</Text>
            <Text className="text-[#D4AF37] text-sm font-semibold ml-1">Get the Customer App</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}
