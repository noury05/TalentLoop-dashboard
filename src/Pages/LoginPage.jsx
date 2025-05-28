import { useState } from 'react';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { db } from "../FirebaseConnect/firebase";

const LoginPage = ({ setAdmin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const adminRef = ref(db, 'admins');
      const adminQuery = query(adminRef, orderByChild('email'), equalTo(email));
      const snapshot = await get(adminQuery);

      if (!snapshot.exists()) {
        throw new Error('Invalid credentials');
      }

      const admins = snapshot.val();
      const adminKey = Object.keys(admins).find(key => admins[key].email === email);

      if (!adminKey || admins[adminKey].password !== password) {
        throw new Error('Invalid credentials');
      }

      const adminData = {
        ...admins[adminKey],
        id: adminKey
      };

      localStorage.setItem('admin', JSON.stringify(adminData));
      setAdmin(adminData);
      navigate('/overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-30">
      <main className="max-w-7x1 mx-auto py-52 px-92 lg:px-96">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-700"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-700"
            required
          />
          <div className="mt-2 flex items-center">
            <input
              id="show-password"
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="mr-2"
            />
            <label htmlFor="show-password" className="text-sm text-gray-600">Show password</label>
          </div>
        </div>
        

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
        >
          {isLoading ? 'Authenticating...' : 'Log In'}
        </button>
      </form>
      </main>
    </div>
  );
};

export default LoginPage;
