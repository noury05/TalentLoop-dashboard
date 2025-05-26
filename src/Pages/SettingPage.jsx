import React from 'react';
import { ref, onValue, update, push, set } from 'firebase/database';
import { motion } from 'framer-motion';
import Header from '../components/common/Header';
import { db } from '../FirebaseConnect/firebase';

export class SettingsPage extends React.Component {
  constructor() {
    super();
    this.state = {
      adminData: {
        name: '',
        email: ''
      },
      newAdminData: {
        name: '',
        email: '',
        password: ''
      },
      currentPassword: '',
      newPassword: '',
      twoFactorEnabled: false
    };
  }

  componentDidMount() {
    this.fetchAdminData();
  }

  fetchAdminData = () => {
    const adminRef = ref(db, 'admins/adminId1');
    onValue(adminRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.setState({ 
          adminData: {
            name: data.name || '',
            email: data.email || ''
          }
        });
      }
    });
  };

  handleProfileChange = (e) => {
    this.setState({
      adminData: {
        ...this.state.adminData,
        [e.target.name]: e.target.value
      }
    });
  };

  handlePasswordChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleTwoFactorToggle = () => {
    this.setState(prevState => ({
      twoFactorEnabled: !prevState.twoFactorEnabled
    }));
  };

  handleLogout = () => {
    localStorage.removeItem('adminToken');
    sessionStorage.clear();
    window.location.href = '/login';
  };

  saveProfile = () => {
    const updates = {
      '/admins/adminId1': this.state.adminData
    };
    
    update(ref(db), updates)
      .then(() => alert('Profile updated successfully!'))
      .catch(error => alert('Update failed: ' + error.message));
  };

  updatePassword = () => {
    const { currentPassword, newPassword } = this.state;
    if (!currentPassword || !newPassword) {
      alert('Please fill in both password fields');
      return;
    }

    const updates = {
      '/admins/adminId1/password': newPassword
    };
    
    update(ref(db), updates)
      .then(() => {
        alert('Password updated successfully!');
        this.setState({ currentPassword: '', newPassword: '' });
      })
      .catch(error => alert('Password update failed: ' + error.message));
  };

  handleNewAdminChange = (e) => {
    this.setState({
      newAdminData: {
        ...this.state.newAdminData,
        [e.target.name]: e.target.value
      }
    });
  };

  handleAddAdmin = () => {
    const { newAdminData } = this.state;
    if (!newAdminData.name || !newAdminData.email || !newAdminData.password) {
      alert('Please fill all fields for new admin');
      return;
    }

    const newAdminRef = push(ref(db, 'admins'));
    set(newAdminRef, {
      ...newAdminData,
      created_at: Date.now()
    })
    .then(() => {
      alert('New admin added successfully!');
      this.setState({ newAdminData: { name: '', email: '', password: '' } });
    })
    .catch(error => alert('Error adding admin: ' + error.message));
  };

  render() {
    const { adminData, newAdminData, currentPassword, newPassword, twoFactorEnabled } = this.state;

    return (
      <div className="flex-1 overflow-auto relative z-10">
        <Header title="Settings" />

        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-8">
          {/* Add New Admin Section */}
          <motion.div 
            className="bg-gray-500 p-6 rounded-lg shadow-md border border-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-semibold text-black mb-6">Add New Admin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-900">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newAdminData.name}
                    onChange={this.handleNewAdminChange}
                    className="w-full bg-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newAdminData.email}
                    onChange={this.handleNewAdminChange}
                    className="w-full bg-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={newAdminData.password}
                    onChange={this.handleNewAdminChange}
                    className="w-full bg-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={this.handleAddAdmin}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors w-full"
                >
                  Create New Admin
                </button>
              </div>
            </div>
          </motion.div>

          {/* Profile Section */}
          <motion.div 
            className="bg-gray-500 p-6 rounded-lg shadow-md border border-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-semibold text-black mb-6">Profile Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-900">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={adminData.name}
                    onChange={this.handleProfileChange}
                    className="w-full bg-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={adminData.email}
                    onChange={this.handleProfileChange}
                    className="w-full bg-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <button
                  onClick={this.saveProfile}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors w-full"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </motion.div>

          {/* Security Section */}
          <motion.div 
            className="bg-gray-500 p-6 rounded-lg shadow-md border border-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-semibold text-black mb-6">Security Settings</h2>
            <div className="space-y-8 text-gray-300">
              <div className="p-4 bg-gray-750 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-400">Extra security layer for your account</p>
                  </div>
                  <button
                    onClick={this.handleTwoFactorToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      twoFactorEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-750 rounded-lg space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                <div>
                  <label className="block text-sm mb-2">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={currentPassword}
                    onChange={this.handlePasswordChange}
                    className="w-full bg-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={newPassword}
                    onChange={this.handlePasswordChange}
                    className="w-full bg-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={this.updatePassword}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors w-full"
                >
                  Change Password
                </button>
              </div>
            </div>
          </motion.div>

          {/* Logout Section */}
          <motion.div 
            className="bg-gray-500 p-6 rounded-lg shadow-md border border-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between p-4 bg-cyan-700/10 rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-white">Logout Account</h3>
                <p className="text-sm text-cyan-400">Sign out from current session</p>
              </div>
              <button
                onClick={this.handleLogout}
                className="bg-cyan-700 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Logout Now
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }
}

export default SettingsPage;