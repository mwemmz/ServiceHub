/**
 * Expo configuration.
 * Map API keys come from environment variables — never put secrets in source files.
 */
export default {
  expo: {
    name: 'ServiceHub',
    slug: 'ServiceHub',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'servicehub',
    userInterfaceStyle: 'light',
    ios: {
      icon: './assets/expo.icon',
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'ServiceHub uses your location to show nearby providers and estimate arrival times.',
        NSPhotoLibraryUsageDescription: 'Allow ServiceHub to use your photos for your profile.',
        NSCameraUsageDescription: 'Allow ServiceHub to take a profile photo.',
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#F8F4F0',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
        },
      },
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#F8F4F0',
          image: './assets/images/splash-icon.png',
          imageWidth: 80,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'ServiceHub uses your location to show nearby providers and estimate arrival times.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow ServiceHub to use your photos for your profile.',
          cameraPermission: 'Allow ServiceHub to take a profile photo.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
