import React from 'react';
import { db } from '../FirebaseConnect/firebase';
import { ref, onValue, get, remove } from 'firebase/database';
import { motion } from 'framer-motion';
import Header from '../components/common/Header';

export class PostsPage extends React.Component {
  constructor() {
    super();
    this.state = {
      pendingPosts: [],
      users: {},
    };
  }

  componentDidMount() {
    this.fetchPendingPosts();
  }

  fetchUserName = async (userId) => {
    if (this.state.users[userId]) return;
    const userRef = ref(db, `users/${userId}/name`);
    try {
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

  fetchPendingPosts = () => {
    const postsRef = ref(db, 'posts');
    onValue(postsRef, async (snapshot) => {
      const posts = [];
      const userIds = new Set();
      snapshot.forEach((childSnapshot) => {
        const post = childSnapshot.val();
        if (post.status === 'pending') {
          posts.push({ key: childSnapshot.key, data: post });
          userIds.add(post.user_id);
        }
      });

      await Promise.all([...userIds].map(this.fetchUserName));
      this.setState({ pendingPosts: posts });
    });
  };

  deletePost = async (postKey) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this post? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;

    try {
      const postRef = ref(db, `posts/${postKey}`);
      await remove(postRef);
      
      this.setState((prevState) => ({
        pendingPosts: prevState.pendingPosts.filter((post) => post.key !== postKey),
      }));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  render() {
    const { users, pendingPosts } = this.state;

    return (
      <div className="flex-1 overflow-auto relative z-10">
        <Header title="Pending Posts" />
        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-8">
          <motion.div
            className="bg-gray-500 p-6 rounded-lg shadow-md border border-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-semibold text-black mb-4">Pending Posts</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-400">
                <thead>
                  <tr>
                    {['User', 'Skill/Content', 'Image', 'Description', 'Date', 'Action'].map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-500 divide-y divide-gray-400">
                  {pendingPosts.map((post) => (
                    <motion.tr
                      key={post.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-750"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {users[post.data.user_id] || post.data.user_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {post.data.content?.split(' ')[0]}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {post.data.image ? (
                          <img src={post.data.image} alt="Post" className="h-10 w-10 rounded" />
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{post.data.content}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(post.data.created_at).toLocaleDateString()}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-red-600 hover:text-red-300 cursor-pointer"
                        onClick={() => this.deletePost(post.key)}
                      >
                        Delete
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }
}

export default PostsPage;