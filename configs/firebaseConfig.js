import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// ✅ Decode Base64-encoded Firebase credentials
const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
const serviceAccount = JSON.parse(serviceAccountJson);

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Your Firebase Storage bucket
});

// ✅ Get Firebase Storage Bucket Reference
const bucket = admin.storage().bucket();

export { bucket };