
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";


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


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;

