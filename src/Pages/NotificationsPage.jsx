import React from 'react';
import { db } from '../FirebaseConnect/firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Header from '../components/common/Header';

export class NotificationsPage extends React.Component {
  constructor() {
    super();
    this.state = {
      tableData: [],
      searchTerm: '',
      statusFilter: 'all',
      usersMap: {},
      announcement: {
        audience: '',
        subject: '',
        content: '',
      },
      allUsers: [],
      reportedUsers: [],
      currentPage: 1,
      itemsPerPage: 10
    };
  }

  componentDidMount() {
    this.loadNotifications();
    this.loadUsers();
    this.loadReportedUsers();
  }

  loadNotifications = () => {
    const notifRef = ref(db, 'notifications');
    onValue(notifRef, (snapshot) => {
      const records = [];
      snapshot.forEach((childSnapshot) => {
        const val = childSnapshot.val();
        if (val) {
          records.push({
            key: childSnapshot.key,
            data: val,
          });
        }
      });
      this.setState({ tableData: records });
    });
  };

  loadUsers = () => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const usersMap = {};
      const allUsers = [];
      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val();
        const userId = childSnapshot.key;
        usersMap[userId] = user.name || 'Unnamed User';
        allUsers.push({ id: userId, name: user.name || 'Unnamed User' });
      });
      this.setState({ usersMap, allUsers });
    });
  };

  loadReportedUsers = () => {
    const reportsRef = ref(db, 'reports');
    onValue(reportsRef, (snapshot) => {
      const reportedUsersSet = new Set();
      snapshot.forEach((childSnapshot) => {
        const report = childSnapshot.val();
        if (report && report.reported_user_id) {
          reportedUsersSet.add(report.reported_user_id);
        }
      });
      const reportedUsers = Array.from(reportedUsersSet).map(userId => ({
        id: userId,
        name: this.state.usersMap[userId] || 'Unknown User',
      }));
      this.setState({ reportedUsers });
    });
  };

  handleSearch = (e) => {
    this.setState({
      searchTerm: e.target.value.toLowerCase(),
      currentPage: 1
    });
  };

  handleStatusFilterChange = (e) => {
    this.setState({
      statusFilter: e.target.value,
      currentPage: 1
    });
  };

  handleAnnouncementChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      announcement: {
        ...prevState.announcement,
        [name]: value,
      },
    }));
  };

  handleSubmitAnnouncement = (e) => {
    e.preventDefault();
    const { audience, subject, content } = this.state.announcement;

    if (!subject || !content) {
      alert('Please fill in all required fields');
      return;
    }

    const dbRef = ref(db, 'notifications');
    const newAnnouncement = {
      type: 'announcement',
      message: subject,
      content: content,
      audience: audience,
      created_at: new Date().toISOString(),
      status: 'unread',
      user_id: 'system',
    };

    push(dbRef, newAnnouncement)
      .then(() => {
        this.setState({
          announcement: {
            audience: '',
            subject: '',
            content: '',
          },
        });
      })
      .catch((error) => {
        console.error('Error sending announcement:', error);
      });
  };

  markAsRead = (notificationKey, currentStatus) => {
    if (currentStatus === 'read') {
      alert('This notification is already marked as read.');
      return;
    }

    const notifRef = ref(db, `notifications/${notificationKey}`);
    update(notifRef, { status: 'read' })
      .then(() => console.log('Notification marked as read.'))
      .catch((error) => console.error('Error updating status:', error));
  };

  deleteNotification = (notificationKey) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this notification? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    const notifRef = ref(db, `notifications/${notificationKey}`);
    remove(notifRef)
      .then(() => console.log('Notification deleted.'))
      .catch((error) => console.error('Error deleting notification:', error));
  };

  get filteredNotifications() {
    return this.state.tableData.filter((notification) => {
      const matchesSearch =
        notification.data.message?.toLowerCase().includes(this.state.searchTerm) ||
        this.getUserName(notification.data.user_id)?.toLowerCase().includes(this.state.searchTerm) ||
        notification.data.type?.toLowerCase().includes(this.state.searchTerm);

      const matchesStatus =
        this.state.statusFilter === 'all' ||
        notification.data.status?.toLowerCase() === this.state.statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }

  get paginatedNotifications() {
    const { currentPage, itemsPerPage } = this.state;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return this.filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  }

  renderPagination = () => {
    const totalItems = this.filteredNotifications.length;
    const totalPages = Math.ceil(totalItems / this.state.itemsPerPage);

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => this.setState({ currentPage: i + 1 })}
            className={`px-3 py-1 rounded-md transition-colors ${
              this.state.currentPage === i + 1
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    );
  };

  getUserName(userId) {
    if (userId === 'system') return 'System';
    return this.state.usersMap[userId] || 'Unknown User';
  }

  getStatusBadgeStyle(status) {
    switch (status?.toLowerCase()) {
      case 'unread':
        return 'bg-blue-800 text-blue-100';
      case 'read':
        return 'bg-gray-700 text-gray-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  }

  render() {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <Header title="Notifications" />

        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
          {/* Announcement Form */}
          <motion.div
            className="bg-gray-500 p-6 rounded-lg mb-6 shadow-md"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold text-black mb-4">Send Announcement</h3>
            <form onSubmit={this.handleSubmitAnnouncement}>
              <div className="mb-4">
                <label className="block text-sm text-black mb-2">Send To (Enter 'all', 'reported', or a User ID)</label>
                <input
                  type="text"
                  name="audience"
                  value={this.state.announcement.audience}
                  onChange={this.handleAnnouncementChange}
                  className="bg-gray-600 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="all, reported, or User ID"
                  required
                />
                {this.state.announcement.audience.toLowerCase() === 'reported' && this.state.reportedUsers.length > 0 && (
                  <div className="mt-2 text-sm text-gray-400">
                    Sending to reported users:
                    <ul>
                      {this.state.reportedUsers.map(user => (
                        <li key={user.id}>{user.name} ({user.id})</li>
                      ))}
                    </ul>
                  </div>
                )}
                {this.state.announcement.audience.toLowerCase() !== 'all' && 
                 this.state.announcement.audience.toLowerCase() !== 'reported' && 
                 this.state.announcement.audience && 
                 this.state.usersMap[this.state.announcement.audience] && (
                  <div className="mt-2 text-sm text-gray-400">
                    Sending to user: {this.state.usersMap[this.state.announcement.audience]} ({this.state.announcement.audience})
                  </div>
                )}
                {this.state.announcement.audience.toLowerCase() !== 'all' && 
                 this.state.announcement.audience.toLowerCase() !== 'reported' && 
                 this.state.announcement.audience && 
                 !this.state.usersMap[this.state.announcement.audience] && (
                  <div className="mt-2 text-sm text-red-400">
                    Warning: User ID "{this.state.announcement.audience}" not found.
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm text-black mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={this.state.announcement.subject}
                  onChange={this.handleAnnouncementChange}
                  className="bg-gray-600 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter announcement subject"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-black mb-2">Content</label>
                <textarea
                  name="content"
                  value={this.state.announcement.content}
                  onChange={this.handleAnnouncementChange}
                  className="bg-gray-600 text-white rounded-lg px-4 py-2 w-full h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write your announcement content..."
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Send Announcement
              </button>
            </form>
          </motion.div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="w-full sm:w-2/3 relative">
              <input
                type="text"
                placeholder="Search notifications..."
                className="bg-gray-600 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={this.state.searchTerm}
                onChange={this.handleSearch}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>

            <div className="w-full sm:w-1/3">
              <select
                value={this.state.statusFilter}
                onChange={this.handleStatusFilterChange}
                className="bg-gray-600 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
            </div>
          </div>

          {/* Notifications Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-400">
            <table className="min-w-full divide-y divide-gray-400">
              <thead className="bg-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-500 divide-y divide-gray-400">
                {this.paginatedNotifications.map((notification) => (
                  <motion.tr
                    key={notification.key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {this.getUserName(notification.data.user_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{notification.data.message}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">{notification.data.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(notification.data.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusBadgeStyle(
                          notification.data.status
                        )}`}
                      >
                        {notification.data.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      <button
                        className="text-green-400 hover:text-green-300 hover:underline"
                        onClick={() => this.markAsRead(notification.key, notification.data.status)}
                      >
                        Mark Read
                      </button>
                      <button
                        className="text-red-700 hover:text-red-300 hover:underline"
                        onClick={() => this.deleteNotification(notification.key)}
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {this.renderPagination()}
        </main>
      </div>
    );
  }
}

