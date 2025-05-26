// Import the functions you need from the SDKs you need

// OLD Imports Worked for all pages

// import { initializeApp } from "firebase/app";
// import { getDatabase } from 'firebase/database';

// =================================================================================
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// ===================================================================================

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: "AIzaSyD-W0y0rmjdBCb_ZizylvcfR9hoZgxq68c",
    authDomain: "skillexchange-77b7d.firebaseapp.com",
    databaseURL: "https://skillexchange-77b7d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "skillexchange-77b7d",
    storageBucket: "skillexchange-77b7d.firebasestorage.app",
    messagingSenderId: "1070505142813",
    appId: "1:1070505142813:web:7a6c064b647fcb76a8b4f4",
    measurementId: "G-7NLXKG3TLT"
};

// OLD Connection that worked
// worked for the index.jsx 
// -=======================================================================
// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);

// export default function StartFirebase() {
//     return db;
// }
    // =====================================================================================
// New Connection 
// ========================================================================================

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;


    // ======================================================================================

    // Changes for LoginPage 
    // =========================================================================================
// // 🔧 Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // 🗄️ Initialize Realtime Database
// const db = getDatabase(app);

// // 🔐 Initialize Firebase Auth
// const auth = getAuth(app);

// // 🌍 Export both for use throughout your app
// export { db, auth };

// ===================================================================================================
