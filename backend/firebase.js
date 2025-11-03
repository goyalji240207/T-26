var admin = require("firebase-admin");

var serviceAccount = require("./techkriti-26-firebase-adminsdk-fbsvc-63060d57a1.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
