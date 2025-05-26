import React from 'react';
import { db } from '../FirebaseConnect/firebase';
import { ref, onValue, push } from 'firebase/database';
import { motion } from 'framer-motion';
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Header from '../components/common/Header';

const StatCard = ({ title, value, change }) => (
  <motion.div
    className="bg-gray-500 p-4 rounded-lg border border-gray-400"
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
  >
    <h3 className="text-white text-sm">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <span className="text-2xl font-semibold text-white">{value}</span>
      {change && (
        <span className={`ml-2 text-sm ${change.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
          {change}
        </span>
      )}
    </div>
  </motion.div>
);

export class Overview extends React.Component {
  constructor() {
    super();
    this.state = {
      users: [],
      sessions: [],
      posts: [],
      requests: [],
      skills: [],
      categories: [],
      searchQuery: '',
      selectedCategory: '',
      sortBy: 'percentageDesc',
      showAddSkillModal: false,
      newSkillName: '',
      newSkillDescription: '',
      newSkillCategory: '',
      formError: ''
    };
  }

  componentDidMount() {
    ['users', 'sessions', 'posts', 'requests', 'skills', 'categories'].forEach(this.fetchData);
  }

  fetchData = (path) => {
    const dbRef = ref(db, path);
    onValue(dbRef, (snapshot) => {
      const data = [];
      snapshot.forEach((child) => {
        data.push({ key: child.key, ...child.val() });
      });
      this.setState({ [path]: data });
    });
  };

  processWeeklyActivity = () => {
    const recentSessions = this.state.sessions.slice(-7);
    return recentSessions.map(session => ({
      day: new Date(session.scheduled_at).toLocaleDateString('en-US', { weekday: 'short' }),
      count: session.count || 0
    }));
  };

  processAccountGrowth = () => {
    const monthlyCounts = this.state.users.reduce((acc, user) => {
      const month = new Date(user.created_at).getMonth();
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(monthlyCounts).map(([month, count]) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month],
      growth: count
    }));
  };

  processSkillsDistribution = () => {
    const { skills, categories, searchQuery, selectedCategory, sortBy } = this.state;
    const totalSkills = skills.reduce((sum, skill) => sum + (skill.count || 0), 0);

    let processedSkills = skills.map(skill => {
      const category = categories.find(cat => cat.key === skill.category_id);
      return {
        ...skill,
        categoryName: category ? category.name : 'Uncategorized',
        percentage: totalSkills > 0 ? ((skill.count || 0) / totalSkills * 100).toFixed(2) : 0
      };
    });

    if (searchQuery) {
      processedSkills = processedSkills.filter(skill =>
        skill.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      processedSkills = processedSkills.filter(skill =>
        skill.category_id === selectedCategory
      );
    }

    switch (sortBy) {
      case 'nameAsc':
        processedSkills.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        processedSkills.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'percentageAsc':
        processedSkills.sort((a, b) => a.percentage - b.percentage);
        break;
      case 'percentageDesc':
      default:
        processedSkills.sort((a, b) => b.percentage - a.percentage);
    }

    return processedSkills;
  };

  handleAddSkill = () => {
    const { newSkillName, newSkillDescription, newSkillCategory } = this.state;
    if (!newSkillName || !newSkillCategory) {
      this.setState({ formError: 'Name and Category are required' });
      return;
    }

    const skillsRef = ref(db, 'skills');
    push(skillsRef, {
      name: newSkillName,
      description: newSkillDescription,
      category_id: newSkillCategory,
      created_at: new Date().toISOString(),
      count: 0
    });

    this.setState({
      showAddSkillModal: false,
      newSkillName: '',
      newSkillDescription: '',
      newSkillCategory: '',
      formError: ''
    });
  };

  render() {
    const {
      users,
      sessions,
      posts,
      requests,
      categories,
      searchQuery,
      selectedCategory,
      sortBy,
      showAddSkillModal,
      newSkillName,
      newSkillDescription,
      newSkillCategory,
      formError
    } = this.state;

    const activeSessions = sessions.filter(s => s.status === 'completed').length;
    const pendingPosts = posts.filter(p => p.status === 'pending').length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const skillsDistribution = this.processSkillsDistribution();

    return (
      <div className="flex-1 overflow-auto relative z-10 bg-gray-300 min-h-screen">
        <Header title="Overview" />

        {/* Add Skill Modal */}
        {showAddSkillModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-gray-600 rounded-lg p-6 w-full max-w-md"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <h3 className="text-white text-xl mb-4">Add New Skill</h3>
              
              {formError && (
                <div className="text-red-400 text-sm mb-4">{formError}</div>
              )}

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Skill Name"
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg"
                  value={newSkillName}
                  onChange={(e) => this.setState({ newSkillName: e.target.value })}
                />

                <textarea
                  placeholder="Description (optional)"
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg"
                  value={newSkillDescription}
                  onChange={(e) => this.setState({ newSkillDescription: e.target.value })}
                />

                <select
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg"
                  value={newSkillCategory}
                  onChange={(e) => this.setState({ newSkillCategory: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.key} value={category.key}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  className="px-4 py-2 text-gray-300 hover:text-white"
                  onClick={() => this.setState({ showAddSkillModal: false })}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  onClick={this.handleAddSkill}
                >
                  Create Skill
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Users" value={users.length} />
            <StatCard title="Active Sessions" value={activeSessions} />
            <StatCard title="Pending Posts" value={pendingPosts} />
            <StatCard title="Pending Requests" value={pendingRequests} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              className="bg-gray-500 p-4 rounded-lg border border-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4">Weekly Activity</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={this.processWeeklyActivity()}>
                  <CartesianGrid stroke="#9CA3AF" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="#F9FAFB" />
                  <YAxis stroke="#F9FAFB" />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", color: '#fff' }} />
                  <Bar dataKey="count" fill="#34D399" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              className="bg-gray-500 p-4 rounded-lg border border-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4">Account Growth</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={this.processAccountGrowth()}>
                  <CartesianGrid stroke="#9CA3AF" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#F9FAFB" />
                  <YAxis stroke="#F9FAFB" />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", color: '#fff' }} />
                  <Line type="monotone" dataKey="growth" stroke="#60A5FA" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div
            className="bg-gray-500 p-4 rounded-lg border border-gray-400 mt-6"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Skills Distribution</h2>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                onClick={() => this.setState({ showAddSkillModal: true })}
              >
                Add New Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <input
                type="text"
                placeholder="Search skills..."
                className="bg-gray-600 text-white px-4 py-2 rounded-lg flex-1 min-w-[200px]"
                value={searchQuery}
                onChange={(e) => this.setState({ searchQuery: e.target.value })}
              />

              <select
                className="bg-gray-600 text-white px-4 py-2 rounded-lg"
                value={selectedCategory}
                onChange={(e) => this.setState({ selectedCategory: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.key} value={category.key}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                className="bg-gray-600 text-white px-4 py-2 rounded-lg"
                value={sortBy}
                onChange={(e) => this.setState({ sortBy: e.target.value })}
              >
                <option value="percentageDesc">Sort by: % High-Low</option>
                <option value="percentageAsc">Sort by: % Low-High</option>
                <option value="nameAsc">Sort by: Name A-Z</option>
                <option value="nameDesc">Sort by: Name Z-A</option>
              </select>
            </div>

            <div className="space-y-4">
              {skillsDistribution.map(skill => (
                <div key={skill.key}>
                  <div className="flex justify-between mb-1">
                    <div className="text-white text-sm font-medium">
                      {skill.name}
                      <span className="text-gray-300 ml-2 text-xs">
                        ({skill.categoryName})
                      </span>
                    </div>
                    <span className="text-white text-sm">{skill.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-green-400 h-2.5 rounded-full"
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {skillsDistribution.length === 0 && (
                <div className="text-white text-center py-4">
                  No skills found matching the criteria
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }
}

export default Overview;