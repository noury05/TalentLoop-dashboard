import React from 'react';
import { db } from '../FirebaseConnect/firebase';
import { ref, onValue, remove, update } from 'firebase/database';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Header from "../components/common/Header";

export class RealtimeData extends React.Component {
  constructor() {
    super();
    this.state = {
      tableData: [],
      searchTerm: '',
      newestUser: null,
      sortBy: 'newest',
      filterBy: 'all',
      currentPage: 1,
      usersPerPage: 10
    };
  }

  componentDidMount() {
    const dbRef = ref(db, 'users');
    onValue(dbRef, (snapshot) => {
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);

      let records = [];
      snapshot.forEach(childSnapshot => {
        const userData = childSnapshot.val();
        const createdAt = new Date(userData.created_at);
        const isNew = createdAt >= threeDaysAgo;

        records.push({
          key: childSnapshot.key,
          data: userData,
          isNew: isNew,
          createdAt: createdAt,
        });
      });

      records.sort((a, b) => b.createdAt - a.createdAt);

      this.setState({
        tableData: records,
        newestUser: records.length > 0 ? records[0] : null
      });
    });
  }

  handleSearch = (e) => {
    this.setState({ searchTerm: e.target.value.toLowerCase(), currentPage: 1 });
  };

  handleSortChange = (e) => {
    this.setState({ sortBy: e.target.value, currentPage: 1 });
  };

  handleFilterChange = (e) => {
    this.setState({ filterBy: e.target.value, currentPage: 1 });
  };

  handleDelete = (userKey) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this user? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    const userRef = ref(db, `users/${userKey}`);
    remove(userRef)
      .then(() => console.log("User deleted"))
      .catch((error) => console.error("Error deleting user:", error));
  };

  handleEdit = (userKey, currentData) => {
    const newName = prompt("New name:", currentData.name);
    const newEmail = prompt("New email:", currentData.email);
    if (newName && newEmail) {
      const userRef = ref(db, `users/${userKey}`);
      update(userRef, { name: newName, email: newEmail })
        .then(() => console.log("User updated"))
        .catch((error) => console.error("Error updating user:", error));
    }
  };

  get filteredUsers() {
    const { searchTerm, tableData, filterBy, sortBy } = this.state;

    let filtered = [...tableData];

    if (filterBy === 'new') {
      filtered = filtered.filter(user => user.isNew);
    } else if (filterBy === 'old') {
      filtered = filtered.filter(user => !user.isNew);
    }

    filtered = filtered.filter(user =>
      user.data.name?.toLowerCase().includes(searchTerm) ||
      user.data.email?.toLowerCase().includes(searchTerm)
    );

    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.data.name?.localeCompare(b.data.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.data.name?.localeCompare(a.data.name));
        break;
      default:
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return filtered;
  }

  changePage = (pageNumber) => {
    this.setState({ currentPage: pageNumber });
  };

  renderPagination(totalPages) {
    const { currentPage } = this.state;

    return (
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={`px-3 py-1 rounded ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => this.changePage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    );
  }

  render() {
    const { searchTerm, sortBy, filterBy, currentPage, usersPerPage } = this.state;

    const allUsers = this.filteredUsers;
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = allUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(allUsers.length / usersPerPage);

    return (
      <div className="flex-1 overflow-auto relative z-10">
        <Header title="Users" />
        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
          {/* New Users Cards */}
          {allUsers.filter((user) => user.isNew).slice(0, 4).map((user, index) => (
            <motion.div
              key={user.key}
              className="inline-block w-64 mr-4 mb-4 p-4 bg-gray-500 text-gray-900 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <h2 className="text-lg font-semibold mb-1">New User</h2>
              <p><strong>Name:</strong> {user.data.name}</p>
              <p><strong>Email:</strong> {user.data.email}</p>
              <p className="text-sm text-blue-400 mt-1">
                Joined on {new Date(user.data.created_at).toLocaleString()}
              </p>
            </motion.div>
          ))}

          {/* Filters & Table */}
          <motion.div
            className="bg-gray-500 p-6 rounded-lg shadow-md border border-gray-400"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="bg-gray-600 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 w-full"
                  value={searchTerm}
                  onChange={this.handleSearch}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>

              <select
                className="bg-gray-600 text-white p-2 rounded-lg w-full"
                value={filterBy}
                onChange={this.handleFilterChange}
              >
                <option value="all">All Users</option>
                <option value="new">New Users (Last 3 Days)</option>
                <option value="old">Old Users</option>
              </select>

              <select
                className="bg-gray-600 text-white p-2 rounded-lg w-full"
                value={sortBy}
                onChange={this.handleSortChange}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-500">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {currentUsers.map(user => (
                    <motion.tr
                      key={user.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {user.data.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.data.name || 'Unknown'}
                              {user.isNew && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-xs text-white rounded-full">NEW</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.data.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(user.data.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.data.status === 'active' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                          {user.data.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        <button
                          className="text-indigo-800 hover:text-indigo-300 mr-2"
                          onClick={() => this.handleEdit(user.key, user.data)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-800 hover:text-red-300"
                          onClick={() => this.handleDelete(user.key)}
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {this.renderPagination(totalPages)}
          </motion.div>
        </main>
      </div>
    );
  }
}

// export default RealtimeData;