import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import LoginPage from "./Pages/LoginPage";
import Overview from "./Pages/Overview";
import ContentPage from './Pages/ContentPage';
import { RealtimeData } from "./Pages/index";
import { ReportPage } from "./Pages/ReportPage";
import { NotificationsPage } from "./Pages/NotificationsPage";
import SettingPage from './Pages/SettingPage';
import PostsPage from './Pages/PostsPage';

import { auth, db } from "./FirebaseConnect/firebase";
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, get } from "firebase/database";

function App() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminRef = ref(db, `admins/${user.uid}`);
          const snapshot = await get(adminRef);
          if (snapshot.exists()) {
            setAdmin({ uid: user.uid, email: user.email });
          } else {
            setAdmin(null);
          }
        } catch (error) {
          console.error("Admin check failed:", error);
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAdmin(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;

  return (
    <div className="flex h-screen bg-white text-gray-100 overflow-hidden">
      {admin ? (
        <>
          <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 opacity-80" />
            <div className="absolute inset-0 backdrop-blur-sm" />
          </div>

          <Sidebar onLogout={handleLogout} />

          <Routes>
            <Route path="/overview" element={<Overview />} />
            <Route path='/content' element={<ContentPage></ContentPage>}></Route>
            <Route path='/posts' element={<PostsPage></PostsPage>}></Route>
            <Route path="/users" element={<RealtimeData></RealtimeData>}> </Route>
            <Route path="/reports" element={<ReportPage></ReportPage>}> </Route>
            <Route path="/notifications" element={<NotificationsPage></NotificationsPage>} ></Route>
            <Route path="/settings" element={<SettingPage></SettingPage>}> </Route>
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </>
      ) : (
        <Routes>
          <Route path="/" element={<LoginPage setAdmin={setAdmin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}

export default App;