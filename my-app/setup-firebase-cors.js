const fs = require('fs');
const { execSync } = require('child_process');

// Create CORS configuration file
const corsConfig = [
  {
    origin: ["http://localhost:3000", "https://salon-booking-app-5bfbe.web.app", "https://salon-booking-app-5bfbe.firebaseapp.com"],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD"],
    maxAgeSeconds: 3600,
    responseHeader: ["Content-Type", "Content-Length", "Content-Encoding", "Content-Disposition", "Origin", "X-Requested-With", "Accept"]
  }
];

// Write CORS configuration to file
fs.writeFileSync('cors.json', JSON.stringify(corsConfig, null, 2));
console.log('CORS configuration file created: cors.json');

console.log('\nTo set up CORS for Firebase Storage, follow these steps:');
console.log('1. Make sure you have Google Cloud SDK installed');
console.log('2. Make sure you are logged in with Firebase and Google Cloud');
console.log('3. Run this command (copy and paste it into your command prompt):');
console.log('   gsutil cors set cors.json gs://salon-booking-app-5bfbe.appspot.com');
console.log('\nIf gsutil is not available, you can configure CORS in the Firebase Console:');
console.log('1. Go to https://console.firebase.google.com/project/salon-booking-app-5bfbe/storage');
console.log('2. Click on the "Rules" tab');
console.log('3. Make sure your rules allow read and write access');
console.log('\nAlternatively, modify your code to use a CORS proxy or enable CORS in your server.'); 