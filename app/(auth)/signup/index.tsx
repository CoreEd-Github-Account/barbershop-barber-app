import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { signupUser } from '../../../services/signup_service';

const BANK_TYPES = [
  { label: 'Bank', value: 'bank' }, { label: 'Easypaisa', value: 'easypaisa' }, { label: 'JazzCash', value: 'jazzcash' },
  { label: 'NayaPay', value: 'nayapay' }, { label: 'SadaPay', value: 'sadapay' },
];

const GENDERS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
] as const;

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [cnic, setCnic] = useState('');
  const [bankType, setBankType] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState('');
  const [profilePhotoBase64, setProfilePhotoBase64] = useState('');
  const [cnicFrontUri, setCnicFrontUri] = useState('');
  const [cnicFrontBase64, setCnicFrontBase64] = useState('');
  const [cnicBackUri, setCnicBackUri] = useState('');
  const [cnicBackBase64, setCnicBackBase64] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setErrors({});

    const localErrors: Record<string, string[]> = {};
    if (!profilePhotoBase64) {
      localErrors.profile_picture_base64 = ['Profile photo is required'];
    }
    if (!cnicFrontBase64) {
      localErrors.cnic_front_image_base64 = ['CNIC front photo is required'];
    }
    if (!cnicBackBase64) {
      localErrors.cnic_back_image_base64 = ['CNIC back photo is required'];
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name, gender, mobile_no: mobileNo, password, role: 'barber', bank_type: bankType,
        bank_name: bankType === 'bank' ? bankName : undefined, account_title: accountTitle,
        bank_account_number: bankAccountNumber, address,
        profile_picture_base64: profilePhotoBase64,
        cnic_front_image_base64: cnicFrontBase64,
        cnic_back_image_base64: cnicBackBase64,
      };
      if (email) payload.email = email;
      if (cnic) payload.cnic = cnic;

      const { status, data } = await signupUser(payload);
      if (status !== 201) {
        if (data.errors) setErrors(data.errors);
        else Alert.alert('Signup failed', data.message || 'Something went wrong');
        return;
      }
      router.replace({
        pathname: '/signup-pending' as any,
        params: {
          name: data.user.name,
          mobile: data.user.mobile_no,
          code: data.verification.code,
        },
      });
    } catch {
      Alert.alert('Network error', 'Could not reach the server. Check the backend is running and your phone is on the same WiFi.');
    } finally {
      setLoading(false);
    }
  };

  const chooseProfilePhoto = async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', `Please allow access to your ${source === 'camera' ? 'camera' : 'photo library'} to add a profile photo.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });

    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      setProfilePhotoUri(asset.uri);
      setProfilePhotoBase64(`data:image/jpeg;base64,${asset.base64}`);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.profile_picture_base64;
        return next;
      });
    }
  };

  const chooseCnicFrontPhoto = async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', `Please allow access to your ${source === 'camera' ? 'camera' : 'photo library'} to add your CNIC front photo.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6, base64: true });

    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      setCnicFrontUri(asset.uri);
      setCnicFrontBase64(`data:image/jpeg;base64,${asset.base64}`);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.cnic_front_image_base64;
        return next;
      });
    }
  };

  const chooseCnicBackPhoto = async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', `Please allow access to your ${source === 'camera' ? 'camera' : 'photo library'} to add your CNIC back photo.`);
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.6, base64: true });

    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      setCnicBackUri(asset.uri);
      setCnicBackBase64(`data:image/jpeg;base64,${asset.base64}`);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.cnic_back_image_base64;
        return next;
      });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ImageBackground source={require('../../../assets/images/background-image.jpeg')} blurRadius={10} resizeMode="cover" style={{ flex: 1 }}>
        <View className="absolute inset-0 bg-[#0D1628]/90" />
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 50, paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
          <View className="items-center mb-4"><Image source={require('../../../assets/images/logo-transparent.png')} resizeMode="contain" className="w-40 h-40" /></View>
          <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-white">Join as a <Text className="text-amber-600">barber</Text></Text>
            <Text className="text-xs text-slate-300 mt-1.5">Create your professional account</Text>
          </View>

          <View className="items-center mb-5">
            <TouchableOpacity onPress={() => chooseProfilePhoto('camera')} className="w-24 h-24 rounded-full border-2 border-[#D4AF37] bg-slate-800 items-center justify-center overflow-hidden">
              {profilePhotoUri ? <Image source={{ uri: profilePhotoUri }} className="w-full h-full" /> : <Ionicons name="camera-outline" size={32} color="#D4AF37" />}
            </TouchableOpacity>
            <Text className="text-slate-200 font-semibold mt-3">Profile Photo *</Text>
            <Text className="text-slate-400 text-xs text-center mt-1">Used for identity verification and shown to customers.</Text>
            <View className="flex-row mt-3 gap-3">
              <TouchableOpacity onPress={() => chooseProfilePhoto('camera')} className="flex-row items-center rounded-full border border-slate-600 bg-slate-800 px-4 py-2">
                <Ionicons name="camera-outline" size={17} color="#D4AF37" /><Text className="text-slate-200 text-xs ml-2">Take photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => chooseProfilePhoto('library')} className="flex-row items-center rounded-full border border-slate-600 bg-slate-800 px-4 py-2">
                <Ionicons name="images-outline" size={17} color="#D4AF37" /><Text className="text-slate-200 text-xs ml-2">Choose photo</Text>
              </TouchableOpacity>
            </View>
            <Validation errors={errors.profile_picture_base64} />
          </View>

          <View className="items-center mb-5">
            <TouchableOpacity onPress={() => chooseCnicFrontPhoto('camera')} className="w-full h-44 rounded-2xl border-2 border-[#D4AF37] bg-slate-800 items-center justify-center overflow-hidden">
              {cnicFrontUri ? (
                <Image source={{ uri: cnicFrontUri }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="items-center">
                  <Ionicons name="card-outline" size={36} color="#D4AF37" />
                  <Text className="text-slate-400 text-xs mt-2">Tap to take photo</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text className="text-slate-200 font-semibold mt-3">CNIC Front Photo *</Text>
            <Text className="text-slate-400 text-xs text-center mt-1">Clear photo of the front side of your CNIC.</Text>
            <View className="flex-row mt-3 gap-3">
              <TouchableOpacity onPress={() => chooseCnicFrontPhoto('camera')} className="flex-row items-center rounded-full border border-slate-600 bg-slate-800 px-4 py-2">
                <Ionicons name="camera-outline" size={17} color="#D4AF37" /><Text className="text-slate-200 text-xs ml-2">Take photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => chooseCnicFrontPhoto('library')} className="flex-row items-center rounded-full border border-slate-600 bg-slate-800 px-4 py-2">
                <Ionicons name="images-outline" size={17} color="#D4AF37" /><Text className="text-slate-200 text-xs ml-2">Choose photo</Text>
              </TouchableOpacity>
            </View>
            <Validation errors={errors.cnic_front_image_base64} />
          </View>

          <View className="items-center mb-5">
            <TouchableOpacity onPress={() => chooseCnicBackPhoto('camera')} className="w-full h-44 rounded-2xl border-2 border-[#D4AF37] bg-slate-800 items-center justify-center overflow-hidden">
              {cnicBackUri ? (
                <Image source={{ uri: cnicBackUri }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="items-center">
                  <Ionicons name="card-outline" size={36} color="#D4AF37" />
                  <Text className="text-slate-400 text-xs mt-2">Tap to take photo</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text className="text-slate-200 font-semibold mt-3">CNIC Back Photo *</Text>
            <Text className="text-slate-400 text-xs text-center mt-1">Clear photo of the back side of your CNIC.</Text>
            <View className="flex-row mt-3 gap-3">
              <TouchableOpacity onPress={() => chooseCnicBackPhoto('camera')} className="flex-row items-center rounded-full border border-slate-600 bg-slate-800 px-4 py-2">
                <Ionicons name="camera-outline" size={17} color="#D4AF37" /><Text className="text-slate-200 text-xs ml-2">Take photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => chooseCnicBackPhoto('library')} className="flex-row items-center rounded-full border border-slate-600 bg-slate-800 px-4 py-2">
                <Ionicons name="images-outline" size={17} color="#D4AF37" /><Text className="text-slate-200 text-xs ml-2">Choose photo</Text>
              </TouchableOpacity>
            </View>
            <Validation errors={errors.cnic_back_image_base64} />
          </View>


          <Field icon="person-outline" label="Full Name *" value={name} onChangeText={setName} placeholder="Ali Khan" errors={errors.name} />

          <View className="mb-3">
            <Text className="text-sm text-slate-300 mb-2">Gender *</Text>
            <View className="flex-row gap-2">
              {GENDERS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: gender === option.value }}
                  onPress={() => setGender(option.value)}
                  className={`flex-1 items-center rounded-full border px-3 py-3 ${gender === option.value ? 'bg-amber-700 border-amber-600' : 'border-slate-600 bg-slate-800/80'}`}
                >
                  <Text className={`text-sm font-medium ${gender === option.value ? 'text-[#1B263B]' : 'text-slate-300'}`}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Validation errors={errors.gender} />
          </View>

          <Field icon="mail-outline" label="Email (optional)" value={email} onChangeText={setEmail} placeholder="ali@example.com" keyboardType="email-address" errors={errors.email} />
          <Field icon="phone-portrait-outline" label="Mobile Number *" value={mobileNo} onChangeText={setMobileNo} placeholder="03001234567" keyboardType="phone-pad" errors={errors.mobile_no} />

          <View className="mb-3 rounded-2xl border border-slate-600 bg-slate-800/80 flex-row items-center px-4" style={{ minHeight: 60 }}>
            <Ionicons name="lock-closed-outline" size={22} color="#D4AF37" />
            <View className="flex-1 ml-3"><Text className="text-xs text-slate-400 mb-1">Password *</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} placeholder="Create a password" placeholderTextColor="#94A3B8" autoCapitalize="none" className="text-base text-white py-0" /></View>
            <TouchableOpacity onPress={() => setPasswordVisible((visible) => !visible)} className="p-2"><Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#CBD5E1" /></TouchableOpacity>
          </View>
          <Validation errors={errors.password} />

          <Field icon="card-outline" label="CNIC *" value={cnic} onChangeText={setCnic} placeholder="3520112345671" keyboardType="numeric" errors={errors.cnic} />

          <View className="mb-3">
            <Text className="text-sm text-slate-300 mb-2">Bank Type *</Text>
            <View className="flex-row flex-wrap gap-2">
              {BANK_TYPES.map((bank) => (
                <TouchableOpacity key={bank.value} onPress={() => { setBankType(bank.value); if (bank.value !== 'bank') setBankName(''); }} className={`px-3 py-2 rounded-full border ${bankType === bank.value ? 'bg-amber-700 border-amber-600' : 'border-slate-600 bg-slate-800/80'}`}>
                  <Text className={`text-xs font-medium ${bankType === bank.value ? 'text-[#1B263B]' : 'text-slate-300'}`}>{bank.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Validation errors={errors.bank_type} />
          </View>

          {bankType === 'bank' && (
            <Field icon="business-outline" label="Bank Name *" value={bankName} onChangeText={setBankName} placeholder="e.g. HBL, Meezan Bank" errors={errors.bank_name} />
          )}
          <Field icon="person-circle-outline" label="Account Title *" value={accountTitle} onChangeText={setAccountTitle} placeholder="Name on the account" errors={errors.account_title} />
          <Field icon="wallet-outline" label="Bank Account Number * / IBAN Number *" value={bankAccountNumber} onChangeText={setBankAccountNumber} placeholder="03001234567" keyboardType="numeric" errors={errors.bank_account_number} />
          <Field icon="location-outline" label="Shop Address *" value={address} onChangeText={setAddress} placeholder="Shop 5, Main Market, Karachi" errors={errors.address} />

          <TouchableOpacity onPress={handleSignup} disabled={loading} className="bg-amber-700 rounded-2xl py-4 flex-row justify-center items-center mt-2">
            {loading ? <ActivityIndicator color="#1B263B" /> : <><Text className="text-[#1B263B] font-bold text-xl">Create Account</Text><Ionicons name="arrow-forward" size={26} color="#1B263B" style={{ marginLeft: 12 }} /></>}
          </TouchableOpacity>

          <View className="flex-row items-center my-6"><View className="flex-1 h-px bg-slate-600" /><Ionicons name="cut-outline" size={24} color="#D4AF37" style={{ marginHorizontal: 16 }} /><View className="flex-1 h-px bg-slate-600" /></View>
          <Link href="/login" asChild><TouchableOpacity className="rounded-2xl border border-slate-600 bg-slate-800/70 py-4 flex-row items-center justify-center"><Text className="text-white text-base">Already have an account?</Text><Text className="text-amber-600 text-base font-semibold ml-3">Log in</Text><Ionicons name="arrow-forward" size={22} color="#D4AF37" style={{ marginLeft: 10 }} /></TouchableOpacity></Link>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, label, value, onChangeText, placeholder, keyboardType, errors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onChangeText: (text: string) => void; placeholder: string; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric'; errors?: string[] }) {
  return <><View className="mb-3 rounded-2xl border border-slate-600 bg-slate-800/80 flex-row items-center px-4" style={{ minHeight: 60 }}><Ionicons name={icon} size={22} color="#D4AF37" /><View className="flex-1 ml-3"><Text className="text-xs text-slate-400 mb-1">{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94A3B8" keyboardType={keyboardType} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} className="text-base text-white py-0" /></View></View><Validation errors={errors} /></>;
}

function Validation({ errors }: { errors?: string[] }) {
  return errors?.map((message) => <Text key={message} className="text-red-300 text-xs mb-2">{message}</Text>);
}
