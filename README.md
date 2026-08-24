# ServiceHub

Expo (React Native) service marketplace app wired to the live Services Booking backend.

## Docs (from Downloads)

- [docs/API.md](docs/API.md) — live REST + Socket.IO reference
- [docs/FRONTEND_BUILD.md](docs/FRONTEND_BUILD.md) — original Flutter frontend prompt (implemented here in Expo)
- [docs/Services_Booking_App_Build_Prompt.docx](docs/Services_Booking_App_Build_Prompt.docx) — full build phases

## Run

```bash
cd C:\Users\Liah\Desktop\ServiceHub
npm start
```

Scan the QR code with Expo Go (same Wi‑Fi).

## Live API

Base URL: `https://services-booking-backend-3wbl.onrender.com/api`

Demo login (from API docs):

- Customer: `customer@test.com` / `password123`
- Also: `rendertest@test.com` / `password123`

## Notes

- Auth uses real JWT login/register + refresh against Render.
- Categories/services/providers fall back to local Beauty / Cleaning / Repair catalog when the live DB is empty (currently empty on Render; `/api/services` can 500).
- Bookings, reviews, notifications, and payments call the live API when possible.
- Socket.IO client is stubbed until `socket.io-client` is installed for live tracking.
