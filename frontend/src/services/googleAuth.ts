import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const setupGoogleAuth = () => {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
};

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  return await GoogleSignin.signIn();
};