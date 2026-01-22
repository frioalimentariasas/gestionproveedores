// This file is used to initialize the Firebase app.
// It is used by the `initializeFirebase` function in `src/firebase/index.ts`.
// It is important to not use this file directly in your components.
// Instead, use the `useFirebaseApp` hook from `src/firebase/provider.tsx`.

// The environment variables are set in the `.env.local` file.
// https://firebase.google.com/docs/web/learn-more#config-object
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
