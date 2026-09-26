import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  errors?: string[];
}

export default function PasswordInput({ label, value, onChangeText, placeholder, errors }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-neutral-700 mb-1">{label}</Text>
      <View className="flex-row items-center border border-neutral-300 rounded-xl bg-white">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder={placeholder}
          autoCapitalize="none"
          className="flex-1 px-4 py-3 text-base"
        />
        <TouchableOpacity onPress={() => setVisible((v) => !v)} className="px-3 py-3">
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#1B263B" />
        </TouchableOpacity>
      </View>
      {errors?.map((msg) => (
        <Text key={msg} className="text-red-500 text-xs mt-1">{msg}</Text>
      ))}
    </View>
  );
}
