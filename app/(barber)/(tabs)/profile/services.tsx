import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { getMyServices, updateMyServices } from '@/services/user_service';

const SERVICE_GROUPS = [
  {
    title: 'Hair Services',
    icon: 'cut-outline' as const,
    services: [
      'Haircut',
      'Hair wash',
      'Blow-dry',
      'Kids haircut',
      'Haircut (for Kids) (Up to 5 Years)',
      'Regular Haircut',
      'Stylish/Styling Haircut',
      'Head shave / full shave',
      'Hair coloring',
    ],
  },
  {
    title: 'Beard Services',
    icon: 'man-outline' as const,
    services: ['Beard trim', 'Beard shave', 'Shave', 'Styling Beard'],
  },
  {
    title: 'Grooming Services',
    icon: 'sparkles-outline' as const,
    services: [
      'Facial',
      'Face cleanup',
      'Face scrub',
      'Head massage',
      'Short Massage',
      'Full Massage',
      'Regular Facial',
      'Full Facial',
      'Hair treatment',
      'Dandruff treatment',
      'Waxing / threading',
    ],
  },
];

export default function ServicesScreen() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) return;

        const { status, data } = await getMyServices(token);
        if (status === 200) {
          setSelectedServices(data.services.map((service: { service_name: string }) => service.service_name));
        } else {
          Alert.alert('Could not load services', data.message || 'Please try again.');
        }
      } catch {
        Alert.alert('Network error', 'Could not reach the backend. Check that it is running and your phone is on the same WiFi.');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const toggleService = (service: string) => {
    setSelectedServices((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service]
    );
  };

  const toggleGroup = (services: string[]) => {
    setSelectedServices((current) => {
      const allSelected = services.every((service) => current.includes(service));
      return allSelected
        ? current.filter((service) => !services.includes(service))
        : Array.from(new Set([...current, ...services]));
    });
  };

  const saveServices = async () => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const { status, data } = await updateMyServices(token, selectedServices);
      if (status === 200) {
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
      } else {
        Alert.alert('Could not save services', data.message || 'Please try again.');
      }
    } catch {
      Alert.alert('Network error', 'Could not reach the backend. Check that it is running and your phone is on the same WiFi.');
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
    <View className="flex-1 bg-[#0D1628]">
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 36 }}>
        <Text className="text-xs font-bold tracking-[3px] text-[#D4AF37] mb-2">SALON AT HOME</Text>
        <Text className="text-3xl font-bold text-white mb-1">My Services</Text>
        <Text className="text-base text-slate-400 mb-3">Select every service you provide to customers.</Text>

        <View className="self-start rounded-full bg-slate-800 border border-slate-700 px-3 py-1.5 mb-7">
          <Text className="text-sm text-[#D4AF37] font-semibold">{selectedServices.length} selected</Text>
        </View>

        {SERVICE_GROUPS.map((group) => {
          const allSelected = group.services.every((service) => selectedServices.includes(service));

          return (
          <View key={group.title} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-full bg-slate-700 items-center justify-center mr-3">
                <Ionicons name={group.icon} size={19} color="#D4AF37" />
              </View>
              <Text className="flex-1 text-lg font-bold text-white">{group.title}</Text>
              <TouchableOpacity onPress={() => toggleGroup(group.services)} className="flex-row items-center py-1">
                <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${allSelected ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-slate-500'}`}>
                  {allSelected && <Ionicons name="checkmark" size={15} color="#1B263B" />}
                </View>
                <Text className="text-sm text-slate-300">Select all</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {group.services.map((service) => {
                const isSelected = selectedServices.includes(service);
                return (
                  <TouchableOpacity
                    key={service}
                    onPress={() => toggleService(service)}
                    activeOpacity={0.8}
                    className={`flex-row items-center rounded-full border px-3 py-2 ${
                      isSelected ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-slate-900 border-slate-600'
                    }`}
                  >
                    {isSelected && <Ionicons name="checkmark" size={15} color="#1B263B" />}
                    <Text className={`text-sm ${isSelected ? 'text-[#1B263B] font-semibold ml-1' : 'text-slate-200'}`}>
                      {service}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          );
        })}

        <TouchableOpacity
          onPress={saveServices}
          disabled={saving}
          className="bg-[#D4AF37] rounded-2xl py-4 items-center mt-2"
        >
          {saving ? <ActivityIndicator color="#1B263B" /> : <Text className="text-base font-bold text-[#1B263B]">Save Services</Text>}
        </TouchableOpacity>
      </ScrollView>

      {showSavedToast && (
        <View className="absolute bottom-8 left-5 right-5 flex-row items-center rounded-2xl border border-[#D4AF37] bg-[#101B30] px-4 py-3 shadow-lg">
          <View className="w-9 h-9 rounded-full bg-[#D4AF37] items-center justify-center mr-3">
            <Ionicons name="checkmark" size={20} color="#1B263B" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">Services saved</Text>
            <Text className="text-slate-400 text-xs mt-0.5">Your changes are saved to your account.</Text>
          </View>
        </View>
      )}
    </View>
  );
}
