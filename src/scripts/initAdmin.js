const admin = require('firebase-admin');

// Initialize the Admin SDK with your service account
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // or use a service account key
});

const email = 'admin@wannagonna.org';

async function setAdminRole() {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Admin role set for ${email}`);
  } catch (error) {
    console.error('Error setting admin role:', error);
  }
}

setAdminRole();
