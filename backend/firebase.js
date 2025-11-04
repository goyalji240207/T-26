var admin = require("firebase-admin");

var serviceAccount = require("./techkriti-26-firebase-adminsdk-fbsvc-63060d57a1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "techkriti-26.appspot.com",
});


const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();
module.exports = {admin,  db, auth, bucket };