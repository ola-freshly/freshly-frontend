import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

// In Expo Go / dev builds the dev server runs on the same host as the backend.
// Derive the host from the Expo manifest so the app works on physical devices
// and emulators without hardcoding an IP address.
function getApiBaseUrl(): string {
  if (extra.apiBaseUrl) return extra.apiBaseUrl as string;

  // hostUri looks like "192.168.x.x:8081" — strip the port and use backend port 3000
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  return 'http://localhost:3000';
}

export const ENV = {
  API_BASE_URL: getApiBaseUrl(),
};
