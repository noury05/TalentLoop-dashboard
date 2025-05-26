// AdminAuth.js
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'; // adjust this to your path

// Register a new admin
export const registerAdmin = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  await set(ref(db, `admins/${uid}`), {
    name,
    email,
    created_at: new Date().toISOString(),
  });
  return uid;
};

const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error('Login failed:', error.message, error.code);
    throw error;
  }
};
