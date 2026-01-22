import { getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';

// These are the public-facing exports of the Firebase module.
// They are used to initialize the Firebase app and to provide
// the Firebase services to the rest of the application.
//
// You should not need to modify this file.
export * from './provider';
export * from './client-provider';
export * from './auth/use-user';

export function initializeFirebase() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  return initializeApp(firebaseConfig);
}
