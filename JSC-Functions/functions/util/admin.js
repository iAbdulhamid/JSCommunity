const admin = require('firebase-admin'); // to access to the firebase DB
admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db };