// components/side-menu.tsx
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

const PLACEHOLDER_ITEMS = ['Menu Item 1', 'Menu Item 2', 'Menu Item 3'];

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <Pressable className="w-72 h-full bg-white pt-14 px-5">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-neutral-900">Menu</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#171717" />
            </TouchableOpacity>
          </View>

          {PLACEHOLDER_ITEMS.map((item) => (
            <View key={item} className="py-4 border-b border-neutral-100">
              <Text className="text-base text-neutral-400">{item}</Text>
            </View>
          ))}

          <Text className="text-xs text-neutral-400 mt-6">More pages coming soon</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}