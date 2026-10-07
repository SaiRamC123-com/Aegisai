import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

if (!admin.apps.length) {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    console.warn("⚠️  Firebase credentials missing. Firestore/Auth disabled.");
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;

export const firebaseReady = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
);