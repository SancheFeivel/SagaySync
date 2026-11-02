// Push notifications for the groups a student follows.
//
// IMPORTANT: remote push does not work in Expo Go (removed in SDK 53+). You need a
// development build before any of this does anything on a real phone:
//   npx eas-cli@latest init                                   # once — writes extra.eas.projectId into app.json
//   npx eas-cli@latest build --profile development --platform android
//   npx expo start --dev-client                                # instead of plain `expo start`
//
// Every function here fails soft and returns nothing useful when push is unavailable
// (Expo Go, an emulator, permission denied, no projectId), so the app still runs in Expo Go.
//
// There is no server. The publishing officer's phone sends the notifications straight to
// Expo's push service, which keeps the prototype off Firebase's paid Blaze plan.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHANNEL = 'default';
const BATCH = 100; // Expo accepts 100 messages per request

// Show a banner even when the app is open in the foreground.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // expo-notifications is inert in Expo Go; ignore.
}

const projectId = (Constants.expoConfig?.extra as any)?.eas?.projectId as string | undefined;

/**
 * This device's Expo push token, or null when push isn't available.
 * Null is normal and not an error: Expo Go, emulators and denied permission all land here.
 */
export async function registerForPush(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // emulators cannot be issued a token

    if (Platform.OS === 'android') {
      // Android 13+ requires a channel to exist before a token can be requested.
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Announcements',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted && current.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return null;

    if (!projectId) {
      console.warn('[push] No extra.eas.projectId in app.json — run `eas init`. Push is off.');
      return null;
    }

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (e) {
    console.warn('[push] No push token on this device:', e);
    return null;
  }
}

type PushMessage = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  channelId: string;
  data?: Record<string, unknown>;
};

/**
 * Sends one notification to many devices.
 * Returns the tokens Expo reported as dead, so the caller can drop them from the registry.
 * Never throws: a failed notification must not make a successful post look failed.
 */
export async function sendPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<string[]> {
  const valid = [...new Set(tokens)].filter((t) => t?.startsWith('ExponentPushToken'));
  const dead: string[] = [];

  for (let i = 0; i < valid.length; i += BATCH) {
    const slice = valid.slice(i, i + BATCH);
    const messages: PushMessage[] = slice.map((to) => ({
      to,
      title,
      body,
      sound: 'default',
      channelId: CHANNEL,
      data,
    }));
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      const json = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
      json.data?.forEach((ticket, j) => {
        if (ticket?.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          dead.push(slice[j]);
        }
      });
    } catch (e) {
      console.warn('[push] Send failed:', e);
    }
  }
  return dead;
}

/** Runs `cb` with the tapped notification's data. Call once; use the returned function to clean up. */
export function onNotificationTap(cb: (data: Record<string, unknown>) => void): () => void {
  try {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      cb((r.notification.request.content.data ?? {}) as Record<string, unknown>);
    });
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
