// app/(barber)/wallet-locked.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
  BackHandler,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { getMyProfile, getPaymentConfig, PaymentConfig, UserProfile } from '@/services/user_service';

export default function WalletLockedScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // Disable hardware back button on Android while blocked
  useEffect(() => {
    const onBackPress = () => {
      // Returning true prevents default back button behavior
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const loadData = useCallback(async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const [profileRes, configRes] = await Promise.all([
        getMyProfile(token),
        getPaymentConfig(token),
      ]);

      if (profileRes.status !== 200 || !profileRes.data.user) {
        router.replace('/login');
        return;
      }

      // If barber is no longer blocked, return to main app
      if (!profileRes.data.user.is_wallet_blocked) {
        router.replace('/');
        return;
      }

      setProfile(profileRes.data.user);
      if (configRes.status === 200 && configRes.data) {
        setPaymentConfig(configRes.data);
      }
    } catch {
      Alert.alert('Error', 'Could not load payment information. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRecheckStatus = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    setChecking(true);
    try {
      const { status, data } = await getMyProfile(token);
      if (status === 200 && data.user) {
        if (!data.user.is_wallet_blocked) {
          Alert.alert(
            'Account Unlocked! 🎉',
            'Your payment has been verified and your wallet has been updated. You can now resume accepting and completing bookings.',
            [{ text: 'Continue to Home', onPress: () => router.replace('/') }]
          );
          return;
        } else {
          setProfile(data.user);
          Alert.alert(
            'Payment Pending',
            'Your account is still marked as pending verification. If you have sent the receipt on WhatsApp, please allow admin a few minutes to process the top-up.'
          );
        }
      } else {
        Alert.alert('Status Check Failed', data.message || 'Could not verify account status.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not reach server to check status.');
    } finally {
      setChecking(false);
    }
  };

  const handleOpenWhatsApp = async () => {
    if (!paymentConfig?.whatsapp_number) {
      Alert.alert('Error', 'WhatsApp number is not configured by admin yet.');
      return;
    }

    const rawNumber = paymentConfig.whatsapp_number.replace(/[^0-9]/g, '');
    const cleanNumber = rawNumber.startsWith('03') ? `92${rawNumber.slice(1)}` : rawNumber;
    const barberName = profile?.name || 'Barber';
    const barberMobile = profile?.mobile_no || '';
    const pendingAmount = Number(profile?.pending_commission_due || 0).toFixed(2);

    const message = `Assalam o Alaikum / Hello Admin,\n\nI am ${barberName} (${barberMobile}).\nI have transferred the pending commission amount of PKR ${pendingAmount}.\nPlease find my payment screenshot attached to verify and top up my wallet.\n\nThank you!`;

    const encodedText = encodeURIComponent(message);
    const deepLink = `whatsapp://send?phone=${cleanNumber}&text=${encodedText}`;
    const webFallback = `https://wa.me/${cleanNumber}?text=${encodedText}`;

    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
      } else {
        await Linking.openURL(webFallback);
      }
    } catch {
      Alert.alert('Error', 'Could not open WhatsApp. Please ensure WhatsApp is installed.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await Promise.all([
            SecureStore.deleteItemAsync('token'),
            SecureStore.deleteItemAsync('role'),
            SecureStore.deleteItemAsync('remembered_password'),
          ]);
          router.replace('/login');
        },
      },
    ]);
  };

  if (loading || !profile) {
    return (
      <View className="flex-1 bg-[#0D1628] items-center justify-center">
        <ActivityIndicator color="#D4AF37" size="large" />
        <Text className="text-slate-400 mt-4 text-sm">Checking account status...</Text>
      </View>
    );
  }

  const pendingDue = Number(profile.pending_commission_due || 0);

  return (
    <View className="flex-1 bg-[#0D1628]">
      {/* Header */}
      <View className="px-5 pt-14 pb-5 bg-[#101B30] border-b border-slate-700 flex-row items-center justify-between">
        <View>
          <Text className="text-xs tracking-[3px] text-amber-600 font-semibold">SALON AT HOME</Text>
          <Text className="text-xl font-bold text-white mt-1">Account Locked</Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text className="text-red-400 text-xs font-semibold ml-1.5">Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View className="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 mb-5 items-center">
          <View className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 items-center justify-center mb-3">
            <Ionicons name="lock-closed" size={32} color="#EF4444" />
          </View>
          <Text className="text-lg font-bold text-red-200 text-center">Wallet Balance Insufficient</Text>
          <Text className="text-xs text-slate-300 text-center mt-2 leading-5">
            Your account has been temporarily paused because a recent job commission could not be deducted from your wallet balance.
          </Text>

          {/* Amount Owed Card */}
          <View className="w-full bg-[#101B30] border border-red-500/30 rounded-2xl p-4 mt-4 items-center">
            <Text className="text-xs tracking-wider text-slate-400">OUTSTANDING COMMISSION DUE</Text>
            <Text className="text-2xl font-bold text-[#D4AF37] mt-1">
              PKR {pendingDue.toFixed(2)}
            </Text>
            <Text className="text-[11px] text-slate-400 mt-1 text-center">
              Pay this exact amount or more to settle your dues and reactivate your account.
            </Text>
          </View>
        </View>

        {/* Step-by-Step Instructions */}
        <View className="rounded-3xl border border-slate-700 bg-slate-800/80 p-5 mb-5">
          <Text className="text-base font-bold text-white mb-3">How to Unlock Your Account</Text>

          <View className="flex-row items-start mb-3">
            <View className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/40 items-center justify-center mr-3 mt-0.5">
              <Text className="text-xs font-bold text-amber-500">1</Text>
            </View>
            <Text className="flex-1 text-xs text-slate-300 leading-5">
              Transfer at least <Text className="font-bold text-white">PKR {pendingDue.toFixed(2)}</Text> to the bank/Easypaisa account or scan the QR code below.
            </Text>
          </View>

          <View className="flex-row items-start mb-3">
            <View className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/40 items-center justify-center mr-3 mt-0.5">
              <Text className="text-xs font-bold text-amber-500">2</Text>
            </View>
            <Text className="flex-1 text-xs text-slate-300 leading-5">
              Take a screenshot or receipt of the completed transfer from your banking app.
            </Text>
          </View>

          <View className="flex-row items-start">
            <View className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/40 items-center justify-center mr-3 mt-0.5">
              <Text className="text-xs font-bold text-amber-500">3</Text>
            </View>
            <Text className="flex-1 text-xs text-slate-300 leading-5">
              Tap the button below to send your payment screenshot to the Admin on WhatsApp for instant verification and top-up.
            </Text>
          </View>
        </View>

        {/* Payment Details Card */}
        <View className="rounded-3xl border border-slate-700 bg-slate-800/80 p-5 mb-5">
          <Text className="text-base font-bold text-white mb-1">Admin Payment Details</Text>
          <Text className="text-xs text-slate-400 mb-4">Tap text or select to copy account numbers.</Text>

          {paymentConfig ? (
            <View className="space-y-3">
              {paymentConfig.bank_name ? (
                <View className="rounded-2xl bg-slate-900/60 p-3.5 mb-2.5">
                  <Text className="text-[11px] text-slate-400">BANK / WALLET</Text>
                  <Text selectable className="text-sm font-semibold text-white mt-0.5">
                    {paymentConfig.bank_name}
                  </Text>
                </View>
              ) : null}

              {paymentConfig.account_title ? (
                <View className="rounded-2xl bg-slate-900/60 p-3.5 mb-2.5">
                  <Text className="text-[11px] text-slate-400">ACCOUNT TITLE</Text>
                  <Text selectable className="text-sm font-semibold text-white mt-0.5">
                    {paymentConfig.account_title}
                  </Text>
                </View>
              ) : null}

              {paymentConfig.account_number ? (
                <View className="rounded-2xl bg-slate-900/60 p-3.5 mb-2.5">
                  <Text className="text-[11px] text-slate-400">ACCOUNT / IBAN NUMBER</Text>
                  <Text
                    selectable
                    className="text-base font-bold text-[#D4AF37] mt-0.5 tracking-wide"
                  >
                    {paymentConfig.account_number}
                  </Text>
                  <Text className="text-[10px] text-slate-500 mt-1">Select text above to copy</Text>
                </View>
              ) : null}

              {/* QR Code */}
              {paymentConfig.qr_image_url ? (
                <View className="rounded-2xl bg-slate-900/60 p-4 items-center mt-2">
                  <Text className="text-xs font-semibold text-slate-300 mb-3">Scan QR Code to Pay</Text>
                  <Image
                    source={{ uri: paymentConfig.qr_image_url }}
                    className="w-48 h-48 rounded-xl bg-white p-2"
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </View>
          ) : (
            <View className="py-4 items-center">
              <Text className="text-xs text-slate-400">Admin payment details are not configured yet.</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="space-y-3 gap-3">
          <TouchableOpacity
            onPress={handleOpenWhatsApp}
            disabled={!paymentConfig?.whatsapp_number}
            className="w-full rounded-2xl bg-emerald-600 py-4 px-5 flex-row items-center justify-center shadow-lg shadow-emerald-900/50"
          >
            <Ionicons name="logo-whatsapp" size={22} color="white" />
            <Text className="text-white font-bold text-base ml-2.5">Send Receipt on WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRecheckStatus}
            disabled={checking}
            className="w-full rounded-2xl bg-amber-700 py-4 px-5 flex-row items-center justify-center shadow-lg shadow-black/40"
          >
            {checking ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">I Have Paid — Check Status</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-8 items-center">
          <Text className="text-[11px] text-slate-500 text-center">
            Need help? Contact support or call administrator at {paymentConfig?.whatsapp_number || 'support helpline'}.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
