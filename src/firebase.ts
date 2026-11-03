import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  signOut,
  // The React Native build exports this at runtime, but the default type definitions omit it.
  // @ts-ignore
  getReactNativePersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  // initializeAuth throws if auth was already initialized (e.g. fast refresh)
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);

/**
 * Makes a login for someone else (an admin adding an officer) without signing the admin out.
 * createUserWithEmailAndPassword signs in as the new account, so it runs on a throwaway
 * second Firebase app whose login lives in memory only; that app is deleted afterwards.
 * Returns the new account's uid. Throws Firebase auth errors (e.g. auth/email-already-in-use).
 */
export async function createAccount(email: string, password: string): Promise<string> {
  const temp = initializeApp(firebaseConfig, `create-account-${Date.now()}`);
  try {
    const tempAuth = initializeAuth(temp, { persistence: inMemoryPersistence });
    const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
    await signOut(tempAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(temp).catch(() => {});
  }
}
