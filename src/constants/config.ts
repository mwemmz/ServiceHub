/**
 * Live backend from docs/API.md and docs/FRONTEND_BUILD.md
 */
export const AppConfig = {
  name: 'ServiceHub',
  tagline: 'Solutions, Near You',
  currency: 'ZMW',
  /** Live Render backend */
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'https://services-booking-backend-3wbl.onrender.com/api',
  socketUrl:
    process.env.EXPO_PUBLIC_SOCKET_URL?.replace(/\/$/, '') ||
    'https://services-booking-backend-3wbl.onrender.com',
  /** When the live API has no categories/services yet, show local Beauty/Cleaning/Repair catalog. */
  useLocalCatalogFallback: true,
  demoCustomer: {
    email: 'customer@test.com',
    password: 'password123',
  },
  demoProvider: {
    email: 'rendertest@test.com',
    password: 'password123',
  },
  mapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  defaultMapRegion: {
    latitude: -15.4167,
    longitude: 28.2833,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  },
} as const;
