import { Image, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SUPPORT_PHONE_DISPLAY = process.env.EXPO_PUBLIC_SUPPORT_PHONE || '03195945557';
const SUPPORT_WHATSAPP_NUMBER = SUPPORT_PHONE_DISPLAY.replace(/\D/g, '').replace(/^0/, '92');

export default function SignupPendingScreen() {
  const { name = 'Barber', mobile = '', code = '' } = useLocalSearchParams<{
    name?: string;
    mobile?: string;
    code?: string;
  }>();

  const verificationMessage = `Hello, I registered as a barber for Salon at Home.\nName: ${name}\nMobile: ${mobile}\nVerification code: ${code}`;

  const openWhatsApp = () => {
    const url = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(verificationMessage)}`;
    Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-[#0D1628]">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 52, justifyContent: 'center' }}>
        <View className="items-center">
          <Image source={require('../../../assets/images/logo-transparent.png')} resizeMode="contain" className="w-40 h-40" />

          <View className="w-16 h-16 rounded-full bg-slate-800 border border-[#D4AF37] items-center justify-center mt-2 mb-5">
            <Ionicons name="time-outline" size={33} color="#D4AF37" />
          </View>

          <Text className="text-xs font-bold tracking-[3px] text-[#D4AF37]">SALON AT HOME</Text>
          <Text className="text-2xl font-bold text-white mt-3 text-center">Account pending approval</Text>
          <Text className="text-slate-400 text-center text-base leading-6 mt-3">
            Verify your WhatsApp number so our support team can review and activate your barber account.
          </Text>
        </View>

        <View className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mt-8">
          <Text className="text-slate-400 text-xs text-center">YOUR VERIFICATION CODE</Text>
          <Text className="text-[#D4AF37] text-3xl tracking-[7px] font-bold text-center mt-2">{code || '------'}</Text>
          <Text className="text-slate-300 text-sm text-center leading-5 mt-5">
            Tap the button below, then send the prefilled WhatsApp message to our support team at {SUPPORT_PHONE_DISPLAY}.
          </Text>
        </View>

        <TouchableOpacity onPress={openWhatsApp} className="bg-[#D4AF37] rounded-2xl py-4 flex-row items-center justify-center mt-6">
          <Ionicons name="logo-whatsapp" size={24} color="#1B263B" />
          <Text className="text-[#1B263B] font-bold text-base ml-3">Verify on WhatsApp</Text>
        </TouchableOpacity>

        <View className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4 mt-4 flex-row">
          <Ionicons name="shield-checkmark-outline" size={24} color="#D4AF37" />
          <Text className="flex-1 text-slate-400 text-sm leading-5 ml-3">
            After we confirm that the WhatsApp sender matches your registered mobile number, your account will be activated.
          </Text>
        </View>

        <Link href="/login" asChild>
          <TouchableOpacity className="py-5 mt-3">
            <Text className="text-center text-slate-300">Already activated? <Text className="text-[#D4AF37] font-semibold">Log in</Text></Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </View>
  );
}
