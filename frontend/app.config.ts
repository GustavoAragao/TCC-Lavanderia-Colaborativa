import 'dotenv/config';

export default {
  expo: {
    name: "Lavanderia Colaborativa",
    slug: "lavanderia",
    version: "1.0.0",
    scheme: "lavanderia-app",
    plugins: [
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME,
          androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
        }
      ],
      "expo-router"
    ],
    ios: {
      bundleIdentifier: "com.gustavo.lavanderia",
      supportsTablet: true
    },
    android: {
      package: "com.gustavo.lavanderia",
      // O Expo usa o androidClientId definido nos plugins para o Google Sign-in
    },
  }
};