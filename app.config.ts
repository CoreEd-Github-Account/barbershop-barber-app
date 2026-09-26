import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'BarberShop Barber',
  slug: 'barbershop-barber-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'barbershopbarber',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.barbershop.barber',
    buildNumber: '1.0.0',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "Allow BarberShop to use your location so customers can find you while you're online.",
      NSFaceIDUsageDescription: "Allow BarberShop to use Face ID for fast and secure login.",
    },
  },
  android: {
    package: 'com.barbershop.barber',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'POST_NOTIFICATIONS',
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      },
    },
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-audio',
    'expo-font',
    'expo-image',
    'expo-status-bar',
    'expo-web-browser',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: "Allow BarberShop to use your location so customers can find you while you're online.",
      },
    ],
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/logo-transparent.png',
        imageWidth: 170,
        resizeMode: 'contain',
        backgroundColor: '#0D1628',
        dark: {
          backgroundColor: '#0D1628',
        },
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission: 'Allow Salon at Home to take your profile photo for barber identity verification.',
        photosPermission: 'Allow Salon at Home to select your profile photo for barber identity verification.',
      },
    ],
    'expo-secure-store',
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
