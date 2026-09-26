// app/(barber)/profile/help-support.tsx
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE || '03195945557';
const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'twahasiddqui11@gmail.com';

export default function HelpSupportScreen() {
  return (
    <View className="flex-1 bg-[#0D1628] px-5 pt-14">
      <Text className="text-xs font-bold tracking-[3px] text-[#D4AF37] mb-2">SALON AT HOME</Text>
      <Text className="text-3xl font-bold text-white mb-1">Help & Support</Text>
      <Text className="text-base text-slate-400 mb-8">We&apos;re here to help</Text>

      <TouchableOpacity
        onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`)}
        className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700 flex-row items-center"
      >
        <View className="w-11 h-11 rounded-full bg-slate-700 items-center justify-center mr-4">
          <Ionicons name="call-outline" size={22} color="#D4AF37" />
        </View>
        <View>
          <Text className="text-sm text-slate-400">Call us</Text>
          <Text className="text-base font-semibold text-white">{SUPPORT_PHONE}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700 flex-row items-center"
      >
        <View className="w-11 h-11 rounded-full bg-slate-700 items-center justify-center mr-4">
          <Ionicons name="mail-outline" size={22} color="#D4AF37" />
        </View>
        <View>
          <Text className="text-sm text-slate-400">Email us</Text>
          <Text className="text-base font-semibold text-white">{SUPPORT_EMAIL}</Text>
        </View>
      </TouchableOpacity>

      <Text className="text-xs text-slate-500 mt-2">
        Support hours: Monday to Saturday, 10 AM – 7 PM
      </Text>
    </View>
  );
}
