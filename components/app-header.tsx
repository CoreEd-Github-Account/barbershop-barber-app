// components/app-header.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AppHeaderProps {
  title: string;
  onMenuPress: () => void;
}

export default function AppHeader({ title, onMenuPress }: AppHeaderProps) {
  return (
    <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-neutral-200">
      <TouchableOpacity onPress={onMenuPress} className="mr-4">
        <Ionicons name="menu" size={28} color="#1B263B" />
      </TouchableOpacity>
      <Text className="text-lg font-bold text-neutral-900">{title}</Text>
    </View>
  );
}
