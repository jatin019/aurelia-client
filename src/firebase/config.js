// ============================================================
//  FIREBASE SETUP — 5 minutes, do this first!
//
//  1. Go to https://console.firebase.google.com
//  2. Click "Add project" → name it "aurelia-jewellery" → Create
//  3. Left sidebar → "Firestore Database" → Create database
//     → Start in TEST MODE → Choose region → Done
//  4. Left sidebar → "Storage" → Get started
//     → Start in TEST MODE → Done
//  5. Click ⚙️ gear icon → "Project settings"
//     → Scroll down → Click </> Web app → Register as "aurelia"
//     → Copy the firebaseConfig object shown
//  6. Paste your values below
//  7. Send the SAME config to your friend for the admin panel
// ============================================================

// ============================================================
//  SAME FIREBASE CONFIG AS CLIENT — use the exact same values
//  Both admin and client connect to the same Firebase project
//  so changes from admin appear instantly on the client website
// ============================================================

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;