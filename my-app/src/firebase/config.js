import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyAxfq3s3nfnFPC6sK5EMd4K8qRHCoYgsQU",
  authDomain: "salon-110da.firebaseapp.com",
  projectId: "salon-110da",
  storageBucket: "salon-110da.firebasestorage.app",
  messagingSenderId: "43940946246",
  appId: "1:43940946246:web:354cacb7ccdb921c480547",
  measurementId: "G-9DTC4QF662"
};


const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage, app }; 