// Firebase is optional - app now uses localStorage
let admin = null;
let db = null;

// Only initialize Firebase if credentials are provided
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin = require('firebase-admin');
    
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
      });
    }

    db = admin.firestore();
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.log('Firebase initialization failed, using localStorage mode:', error.message);
    admin = null;
    db = null;
  }
} else {
  console.log('Firebase credentials not found, using localStorage mode');
}

module.exports = { admin, db };
