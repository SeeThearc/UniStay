import { useState, useEffect } from 'react';
import { Users, DoorOpen, MessageSquare, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import { formatCurrency, getStatusColor } from '../../utils/constants';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard/admin');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const { overview, feeStats, complaintsByStatus, roomsByStatus, recentComplaints, recentLeaves } = dashboardData;

  const statCards = [
    {
      title: 'Total Students',
      value: overview.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Rooms',
      value: overview.totalRooms,
      icon: DoorOpen,
      color: 'bg-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Pending Complaints',
      value: overview.pendingComplaints,
      icon: MessageSquare,
      color: 'bg-yellow-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    {
      title: 'Fee Collected',
      value: formatCurrency(feeStats.totalCollected),
      icon: DollarSign,
      color: 'bg-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  // Prepare chart data
  const roomChartData = roomsByStatus.map(item => ({
    name: item._id,
    value: item.count,
  }));

  const complaintChartData = complaintsByStatus.map(item => ({
    name: item._id,
    count: item.count,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fee Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Fee Amount</h3>
          <p className="text-3xl font-bold text-primary-600">{formatCurrency(feeStats.totalFeeAmount)}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Amount Collected</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(feeStats.totalCollected)}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Pending Dues</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(feeStats.totalPending)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Occupancy Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Room Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roomChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {roomChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Complaint Status Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Complaint Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complaintChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Complaints</h3>
          <div className="space-y-3">
            {recentComplaints.length > 0 ? (
              recentComplaints.map((complaint) => (
                <div key={complaint._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{complaint.title}</p>
                    <p className="text-sm text-gray-600">{complaint.studentId?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent complaints</p>
            )}
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Leave Requests</h3>
          <div className="space-y-3">
            {recentLeaves.length > 0 ? (
              recentLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{leave.studentId?.name}</p>
                    <p className="text-sm text-gray-600">{leave.numberOfDays} days</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent leaves</p>
            )}
          </div>
        </div>
      </div>

      {/* Room Occupancy Info */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Room Occupancy</h3>
            <p className="text-3xl font-bold">{overview.roomOccupancyPercentage}%</p>
            <p className="text-sm opacity-90 mt-1">
              {overview.occupiedRooms} out of {overview.totalRooms} rooms occupied
            </p>
          </div>
          <TrendingUp className="h-16 w-16 opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;