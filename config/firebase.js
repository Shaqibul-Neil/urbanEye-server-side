const admin = require("firebase-admin");

// const serviceAccount = require("../urbaneye-25bfb-firebase-adminsdk.json");

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
