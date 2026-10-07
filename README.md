# TetrixAI Mobile (React Native / Expo)

React Native mobile app for TetrixAI — shares the same backend API and Firebase project as the web frontend.

## Setup

```bash
cd react-nat-app
npm install
```

### Environment

Copy `.env.example` to `.env` and fill in the **same** Firebase credentials used by the web frontend:

```bash
cp .env.example .env
```

The `EXPO_PUBLIC_API_URL` should point to the backend (e.g. `http://<your-ip>:5000/api` for local dev — not `localhost`, since the phone can't reach it).

### Run

```bash
npx expo start          # Expo dev server
npx expo start --android   # or --ios
```

Scan the QR code with Expo Go, or run on a connected device / emulator.

## Auth

The mobile app uses **email/password** Firebase auth (instead of Google OAuth popup used on web). Both auth methods produce the same Firebase ID token, so the backend treats them identically. Doctors sign up with email + password + medical credentials, and sign in with email + password.

## Screens

| Screen | Web Equivalent | Description |
|--------|---------------|-------------|
| SignIn | SignIn + Register | Email/password login & doctor registration |
| Dashboard | Dashboard | Stats, recent patients, recent analyses |
| PatientList | PatientList | Search, filter, add patients |
| PatientDetail | PatientDetail | Tabs: overview, history, scans |
| NewAnalysis | NewAnalysis | Pick patient, capture/upload scan, clinical notes |
| AnalysisReport | AnalysisReport | Full finding cards, confidence meters, disclaimers |
| Profile | Profile | Edit doctor credentials, sign out |
| Admin | AdminDashboard | Doctor management, patient transfers, audit logs |

## Architecture

- **Navigation**: React Navigation (bottom tabs + nested stacks)
- **State**: Zustand (same store shape as web)
- **API**: Axios with Firebase ID token interceptor (identical to web)
- **Firebase**: Same project, same credentials — `initializeAuth` with AsyncStorage persistence
- **Image handling**: `expo-image-picker` (gallery + camera) + `expo-image-manipulator` (downscale to 1024px JPEG, matching the web's `downscaleImage`)
- **Styling**: React Native StyleSheet with the same blue/white clinical color palette

## Assets

You need placeholder icon files in `assets/`:
- `icon.png` (1024x1024)
- `adaptive-icon.png` (1024x1024)

Use any blue medical icon or generate with `npx expo-image-utils`.
