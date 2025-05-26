import React from 'react';
import { db } from '../FirebaseConnect/firebase';
import { ref, onValue, remove, update, push } from 'firebase/database';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Header from '../components/common/Header';

export class ReportPage extends React.Component {
  constructor() {
    super();
    this.state = {
      tableData: [],
      searchTerm: '',
      statusFilter: 'All',
      usersMap: {},
      adminId: 'adminId1',
      currentPage: 1,
      reportsPerPage: 10,
    };
  }

  componentDidMount() {
    this.fetchUsers();
    this.fetchReports();
  }

  fetchUsers = () => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const users = {};
      snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        const userData = childSnapshot.val();
        users[userId] = userData.name || userData.username || userId;
      });
      this.setState({ usersMap: users });
    });
  };

  fetchReports = () => {
    const reportsRef = ref(db, 'reports');
    onValue(reportsRef, (snapshot) => {
      const records = [];
      snapshot.forEach((childSnapshot) => {
        records.push({
          key: childSnapshot.key,
          data: childSnapshot.val(),
        });
      });
      this.setState({ tableData: records });
    });
  };

  handleSearch = (e) => {
    this.setState({ searchTerm: e.target.value.toLowerCase(), currentPage: 1 });
  };

  handleStatusFilter = (e) => {
    this.setState({ statusFilter: e.target.value, currentPage: 1 });
  };

  handleWarnUser = (reportKey, reportedUserId) => {
    const warningMessage = prompt("Enter warning message to send to the user:");
    if (!warningMessage) {
      alert("Warning message is required.");
      return;
    }

    const timestamp = new Date().toISOString();

    const messageData = {
      message: warningMessage,
      sender_id: this.state.adminId,
      receiver_id: reportedUserId,
      created_at: timestamp,
      status: "sent",
    };

    const notificationData = {
      message: warningMessage,
      user_id: reportedUserId,
      status: "unread",
      type: "warning",
      created_at: timestamp,
    };

    const messagesRef = ref(db, 'messages');
    const notificationsRef = ref(db, 'notifications');

    push(messagesRef, messageData)
      .then(() => push(notificationsRef, notificationData))
      .then(() => {
        console.log('Warning and notification sent successfully');
        this.updateReportStatus(reportKey);
      })
      .catch((error) => {
        console.error('Error sending warning or notification:', error);
      });
  };

  handleIgnore = (reportKey) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to ignore and delete this report? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    const reportRef = ref(db, `reports/${reportKey}`);
    remove(reportRef)
      .then(() => console.log('Report ignored and deleted'))
      .catch((error) => console.error('Error deleting report:', error));
  };

  updateReportStatus = (reportKey) => {
    const reportRef = ref(db, `reports/${reportKey}`);
    update(reportRef, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: this.state.adminId,
    });
  };

  get filteredReports() {
    const { tableData, searchTerm, statusFilter, usersMap } = this.state;
    return tableData.filter((report) => {
      const reason = report.data.reason?.toLowerCase() || '';
      const byName = usersMap[report.data.reported_by_id]?.toLowerCase() || '';
      const userName = usersMap[report.data.reported_user_id]?.toLowerCase() || '';
      const status = (report.data.status || '').toLowerCase();

      const matchesSearch =
        reason.includes(searchTerm) ||
        byName.includes(searchTerm) ||
        userName.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'All' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }

  get paginatedReports() {
    const { currentPage, reportsPerPage } = this.state;
    const startIndex = (currentPage - 1) * reportsPerPage;
    return this.filteredReports.slice(startIndex, startIndex + reportsPerPage);
  }

  handlePageChange = (pageNum) => {
    this.setState({ currentPage: pageNum });
  };

  getStatusBadgeStyle = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'bg-yellow-800 text-yellow-100';
      case 'resolved':
        return 'bg-green-800 text-green-100';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  renderPagination = () => {
    const totalPages = Math.ceil(this.filteredReports.length / this.state.reportsPerPage);
    return (
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              this.state.currentPage === i + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => this.handlePageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    );
  };

  render() {
    const { usersMap, searchTerm, statusFilter } = this.state;

    return (
      <div className="flex-1 overflow-auto relative z-10">
        <Header title="Reported Users" />
        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
          <motion.div
            className="bg-gray-500 p-6 rounded-lg mb-6 shadow-md border border-gray-400"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Improved Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search reports..."
                  className="bg-gray-600 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={this.handleSearch}
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              </div>
              <div className="w-full">
                <select
                  className="bg-gray-600 text-white px-4 py-2.5 rounded-lg border border-gray-400 focus:outline-none w-full min-w-[200px]"
                  value={statusFilter}
                  onChange={this.handleStatusFilter}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Reports Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-400">
              <table className="min-w-full divide-y divide-gray-400">
                <thead className="bg-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Reported By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Reported User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-500 divide-y divide-gray-400">
                  {this.paginatedReports.map((report) => (
                    <motion.tr
                      key={report.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-750"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {usersMap[report.data.reported_by_id] || report.data.reported_by_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {usersMap[report.data.reported_user_id] || report.data.reported_user_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {report.data.reason || 'No reason provided'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {report.data.created_at
                          ? new Date(report.data.created_at).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusBadgeStyle(
                            report.data.status
                          )}`}
                        >
                          {report.data.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          className="text-orange-400 hover:text-orange-300"
                          onClick={() => this.handleWarnUser(report.key, report.data.reported_user_id)}
                        >
                          Warn User
                        </button>
                        <button
                          className="text-red-700 hover:text-red-300"
                          onClick={() => this.handleIgnore(report.key)}
                        >
                          Ignore
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {this.renderPagination()}
          </motion.div>
        </main>
      </div>
    );
  }
}

