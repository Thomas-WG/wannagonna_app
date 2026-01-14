import admin from "firebase-admin";

const serviceAccountPath = process.argv[2];
const userUid = process.argv[3];

// Initialize the Admin SDK with your service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

/**
 * Sets admin role for a specified user email in Firebase Authentication
 *
 * This function sets their custom claims
 * to include admin privileges. This is used for initial admin user setup.
 *
 * @async
 * @function initAdmin
 * @param {string} adminUid - The UID of the user to set as admin
 * @throws {Error} If user cannot be found or claims cannot be set
 */
async function initAdmin(adminUid) {
  await admin.auth().setCustomUserClaims(adminUid, {role: "admin"});
  console.log("Admin role set for", adminUid);
}

initAdmin(userUid)
    .then(() => {
      console.log("Exiting");
      process.exit();
    });
