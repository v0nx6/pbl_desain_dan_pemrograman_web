import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const firebaseAdminConfigured = Boolean(
  projectId && clientEmail && privateKey,
);

let adminApp: App | null = null;

export function firebaseAdminAuth(): Auth {
  if (!adminApp) {
    adminApp =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
  }

  return getAuth(adminApp);
}
