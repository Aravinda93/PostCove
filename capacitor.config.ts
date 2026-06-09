import type { CapacitorConfig } from '@capacitor/cli'

// Postcove — Capacitor (native iOS/Android wrapper) config.
// The app is a local-first SPA: `nuxt generate` outputs static files to
// `.output/public`, which Capacitor bundles into the native WebView. There is
// NO server URL — everything runs on-device, matching the privacy blueprint.
const config: CapacitorConfig = {
  appId: 'com.postcove.ai',
  appName: 'Postcove',
  webDir: '.output/public',
  plugins: {
    SplashScreen: {
      launchShowDuration: 700,
      backgroundColor: '#0b1220',
      showSpinner: false
    }
  }
}

export default config
