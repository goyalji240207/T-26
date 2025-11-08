var admin = require("firebase-admin");

var serviceAccount = require("./techkriti-26-firebase-adminsdk-fbsvc-63060d57a1.json");

// Try to get the bucket name from environment variable first, otherwise use the default format
let storageBucket;
if (process.env.FIREBASE_CONFIG) {
  try {
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    storageBucket = firebaseConfig.storageBucket;
  } catch (e) {
    console.log("Could not parse FIREBASE_CONFIG, using default bucket name");
  }
}

// If no bucket name from environment, use the default format
if (!storageBucket) {
  storageBucket = "techkriti-26.firebasestorage.app";
}

console.log("Using storage bucket:", storageBucket);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: storageBucket,
});

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();
module.exports = {admin,  db, auth, bucket };