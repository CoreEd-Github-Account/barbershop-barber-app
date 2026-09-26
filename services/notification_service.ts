import { isRunningInExpoGo } from 'expo';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import type { AndroidImportance, AndroidNotificationPriority } from 'expo-notifications';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { Platform } from 'react-native';

const BOOKING_REQUEST_CHANNEL_ID = 'booking-requests-v2';
const CUSTOMER_CANCELLATION_CHANNEL_ID = 'customer-cancellations-v1';
const MAX_ANDROID_IMPORTANCE = 7 as AndroidImportance;
const MAX_ANDROID_PRIORITY = 'max' as AndroidNotificationPriority;
const BOOKING_BELL_FILE_NAME = 'booking-request-bell.wav';

let bookingBellPlayer: AudioPlayer | null = null;

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function createBookingBellWav() {
  const sampleRate = 22050;
  const durationSeconds = 0.8;
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const bytesPerSample = 2;
  const dataSize = sampleCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.exp(-4.2 * time);
    const firstTone = Math.sin(2 * Math.PI * 880 * time);
    const secondTone = Math.sin(2 * Math.PI * 1320 * time);
    const sample = Math.max(-1, Math.min(1, envelope * (firstTone * 0.65 + secondTone * 0.25)));
    view.setInt16(44 + index * bytesPerSample, sample * 32767, true);
  }

  return new Uint8Array(buffer);
}

async function prepareInAppBookingBell() {
  if (bookingBellPlayer) return;

  const bellFile = new File(Paths.cache, BOOKING_BELL_FILE_NAME);
  if (!bellFile.exists) {
    bellFile.create({ intermediates: true });
    bellFile.write(createBookingBellWav());
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
  });

  bookingBellPlayer = createAudioPlayer(bellFile.uri, {
    keepAudioSessionActive: true,
  });
  bookingBellPlayer.volume = 1;
}

async function playInAppBookingAlert() {
  await prepareInAppBookingBell();
  await bookingBellPlayer?.seekTo(0);
  bookingBellPlayer?.play();
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

async function configureBookingRequestChannel() {
  if (Platform.OS !== 'android') return;

  await setNotificationChannelAsync(BOOKING_REQUEST_CHANNEL_ID, {
    name: 'New booking requests',
    description: 'Alerts when a customer sends a booking request.',
    importance: MAX_ANDROID_IMPORTANCE,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 300, 200, 300],
    showBadge: true,
  });
}

async function configureCustomerCancellationChannel() {
  if (Platform.OS !== 'android') return;

  await setNotificationChannelAsync(CUSTOMER_CANCELLATION_CHANNEL_ID, {
    name: 'Customer cancellations',
    description: 'Alerts when a customer cancels an accepted booking.',
    importance: MAX_ANDROID_IMPORTANCE,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 300, 200, 300],
    showBadge: true,
  });
}

export async function configureNotifications() {
  if (Platform.OS === 'web') return;

  if (isRunningInExpoGo()) {
    await prepareInAppBookingBell();
    return;
  }

  setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  await configureBookingRequestChannel();
  await configureCustomerCancellationChannel();

  const currentPermissions = await getPermissionsAsync();
  if (!currentPermissions.granted) {
    await requestPermissionsAsync();
  }
}

export async function notifyAboutNewBookings(count: number) {
  if (Platform.OS === 'web') return;

  if (isRunningInExpoGo()) {
    await playInAppBookingAlert();
    return;
  }

  await configureBookingRequestChannel();

  const currentPermissions = await getPermissionsAsync();
  const permissions = currentPermissions.granted
    ? currentPermissions
    : await requestPermissionsAsync();

  if (!permissions.granted) {
    console.warn('Booking notification was not shown because notification permission is disabled.');
    return;
  }

  await scheduleNotificationAsync({
    content: {
      title: 'New Booking Request',
      body: count === 1 ? 'You have a new booking request' : `You have ${count} new booking requests`,
      sound: 'default',
      priority: MAX_ANDROID_PRIORITY,
      vibrate: [0, 300, 200, 300],
      data: { type: 'booking-request' },
    },
    trigger: Platform.OS === 'android' ? { channelId: BOOKING_REQUEST_CHANNEL_ID } : null,
  });
}

export async function notifyAboutCustomerCancellations(count: number) {
  if (Platform.OS === 'web') return;

  if (isRunningInExpoGo()) {
    await playInAppBookingAlert();
    return;
  }

  await configureCustomerCancellationChannel();

  const currentPermissions = await getPermissionsAsync();
  const permissions = currentPermissions.granted
    ? currentPermissions
    : await requestPermissionsAsync();

  if (!permissions.granted) {
    console.warn('Cancellation notification was not shown because notification permission is disabled.');
    return;
  }

  await scheduleNotificationAsync({
    content: {
      title: 'Booking Cancelled by Customer',
      body: count === 1
        ? 'A customer cancelled an accepted booking'
        : `${count} customers cancelled accepted bookings`,
      sound: 'default',
      priority: MAX_ANDROID_PRIORITY,
      vibrate: [0, 300, 200, 300],
      data: { type: 'customer-cancellation' },
    },
    trigger: Platform.OS === 'android' ? { channelId: CUSTOMER_CANCELLATION_CHANNEL_ID } : null,
  });
}
