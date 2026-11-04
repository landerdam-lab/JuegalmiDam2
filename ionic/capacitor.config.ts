import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Distinto de la nativa (com.juegalmi.app): las dos APK se pueden instalar a la vez
  appId: 'com.juegalmi.companion',
  appName: 'Almi Companion',
  webDir: 'www',
};

export default config;
