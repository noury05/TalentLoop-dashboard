import React from 'react';
import { db } from '../FirebaseConnect/firebase';
import { ref, onValue, get, set, update, push, remove } from 'firebase/database';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Header from '../components/common/Header';

export class ContentPage extends React.Component {
  constructor() {
    super();
    this.state = {
      feedbacks: [],
      users: {},
      currentPage: 1,
      itemsPerPage: 10,
      searchTerm: '',
      statusFilter: 'All'
    };
  }

  componentDidMount() {
    this.fetchFeedbacks();
  }

  fetchUserName = async (userId) => {
    if (this.state.users[userId]) return;
    try {
      const userRef = ref(db, `users/${userId}/name`);
      const snapshot = await get(userRef);
      const name = snapshot.exists() ? snapshot.val() : 'Unknown User';
      this.setState((prevState) => ({
        users: {
          ...prevState.users,
          [userId]: name,
        },
      }));
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  fetchFeedbacks = () => {
    const feedbackRef = ref(db, 'feedback');
    onValue(feedbackRef, async (snapshot) => {
      const feedbackList = [];
      const userIds = new Set();

      snapshot.forEach((child) => {
        const fb = child.val();
        feedbackList.push({
          key: child.key,
          ...fb,
          date: fb.created_at,
        });
        userIds.add(fb.user_id);
      });

      await Promise.all([...userIds].map(this.fetchUserName));

      this.setState({
        feedbacks: feedbackList.sort((a, b) => new Date(b.date) - new Date(a.date)),
      });
    });
  };

  handleSearch = (e) => {
    this.setState({ searchTerm: e.target.value.toLowerCase(), currentPage: 1 });
  };

  handleStatusFilter = (e) => {
    this.setState({ statusFilter: e.target.value, currentPage: 1 });
  };

  get filteredFeedbacks() {
    const { feedbacks, searchTerm, statusFilter, users } = this.state;
    return feedbacks.filter(fb => {
      const userDisplayName = (users[fb.user_id] || fb.user_id).toLowerCase();
      const feedbackText = (fb.feedback || '').toLowerCase();
      
      const matchesSearch = (
        feedbackText.includes(searchTerm) ||
        userDisplayName.includes(searchTerm)
      );
      
      const matchesStatus = (
        statusFilter === 'All' ||
        (statusFilter === 'Approved' && fb.status === 'done') ||
        (statusFilter === 'Pending' && fb.status !== 'done')
      );

      return matchesSearch && matchesStatus;
    });
  }

  handleApprove = async (feedback) => {
    // Check if already approved
    if (feedback.status === 'done') {
      alert('This feedback is already approved!');
      return;
    }

    const now = new Date().toISOString();
    try {
      await update(ref(db, `feedback/${feedback.key}`), { status: 'done' });

      await set(push(ref(db, 'notifications')), {
        user_id: feedback.user_id,
        message: 'Your feedback has been approved!',
        type: 'feedback',
        status: 'unread',
        created_at: now,
      });

      await set(push(ref(db, 'logs')), {
        action: 'Feedback Approved',
        admin_id: 'adminId1',
        details: `${feedback.user_id}'s feedback was approved.`,
        created_at: now,
      });

      alert('Feedback approved and user notified!');
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Failed to approve feedback.');
    }
  };

  handleDelete = async (feedback) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this feedback?');
    if (!confirmDelete) return;

    try {
      await remove(ref(db, `feedback/${feedback.key}`));

      await set(push(ref(db, 'logs')), {
        action: 'Feedback Deleted',
        admin_id: 'adminId1',
        details: `${feedback.user_id}'s feedback was deleted.`,
        created_at: new Date().toISOString(),
      });

      alert('Feedback deleted successfully!');
    } catch (error) {
      console.error('Deletion failed:', error);
      alert('Failed to delete feedback.');
    }
  };

  renderRating = (rating) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-500'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  renderPagination = () => {
    const { currentPage, itemsPerPage } = this.state;
    const totalPages = Math.ceil(this.filteredFeedbacks.length / itemsPerPage);

    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => this.setState({ currentPage: page })}
            className={`px-3 py-1 rounded-md transition-colors ${
              currentPage === page
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    );
  };

  render() {
    const { users, currentPage, itemsPerPage, searchTerm, statusFilter } = this.state;
    const filteredFeedbacks = this.filteredFeedbacks;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentFeedbacks = filteredFeedbacks.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="flex-1 overflow-auto relative z-10">
        <Header title="User Feedback" />
        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-8">
          <motion.div
            className="bg-gray-500 p-6 rounded-lg shadow-md border border-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search feedback..."
                  className="bg-gray-600 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={this.handleSearch}
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              </div>
              <div className="w-full">
                <select
                  className="bg-gray-600 text-white px-4 py-2.5 rounded-lg border border-gray-400 focus:outline-none w-full"
                  value={statusFilter}
                  onChange={this.handleStatusFilter}
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-500">
                <thead>
                  <tr>
                    {['User', 'Rating', 'Feedback', 'Date', 'Actions'].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-500 divide-y divide-gray-400">
                  {currentFeedbacks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-gray-900">
                        No feedback found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    currentFeedbacks.map((fb) => (
                      <motion.tr
                        key={fb.key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-750"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {users[fb.user_id] || fb.user_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {this.renderRating(fb.rating)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {fb.feedback || 'No comment'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(fb.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-3">
                          {fb.status === 'done' ? (
                            <span className="text-indigo-900 font-semibold">Approved</span>
                          ) : (
                            <button
                              className="text-indigo-600 hover:text-blue-400 font-semibold"
                              onClick={() => this.handleApprove(fb)}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            className="text-red-600 hover:text-red-300 font-semibold"
                            onClick={() => this.handleDelete(fb)}
                          >
                            Delete
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
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

export default ContentPage;