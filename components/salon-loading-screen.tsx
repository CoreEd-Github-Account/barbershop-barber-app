import { ActivityIndicator, Image, Text, View } from 'react-native';

interface SalonLoadingScreenProps {
  message?: string;
}

export default function SalonLoadingScreen({ message = 'Preparing your workspace...' }: SalonLoadingScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-[#0D1628] px-8">
      <Image
        source={require('../assets/images/logo-transparent.png')}
        resizeMode="contain"
        className="w-44 h-44"
      />
      <Text className="mt-5 text-xs font-bold tracking-[3px] text-[#D4AF37]">SALON AT HOME</Text>
      <Text className="mt-2 text-base text-slate-300">{message}</Text>
      <ActivityIndicator color="#D4AF37" size="small" className="mt-6" />
    </View>
  );
}
