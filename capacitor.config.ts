import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stringx.app',
  appName: 'String X',
  webDir: 'dist',

  server: {
    url: 'https://string-x.vercel.app',
    cleartext: false
  }
};

export default config;