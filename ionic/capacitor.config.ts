import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Distinto de la nativa (com.juegalmi.app): las dos APK se pueden instalar a la vez
  appId: 'com.juegalmi.companion',
  appName: 'Almi Companion',
  webDir: 'www',
  server: {
    // Mientras la API vaya por HTTP (A-32): con https://localhost el WebView lo bloquearía como contenido mixto.
    // Con el HTTPS final se quita este bloque.
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
