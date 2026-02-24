import { useState, useEffect } from 'react';
import { Users, MessageSquare, Calendar, DoorOpen } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import { formatDate, getStatusColor } from '../../utils/constants';

const WardenDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard/warden');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const { overview, recentComplaints, recentLeaves } = dashboardData;

  const statCards = [
    {
      title: 'Total Students',
      value: overview.totalStudents,
      icon: Users,
      color: 'border-l-blue-500',
    },
    {
      title: 'Pending Complaints',
      value: overview.pendingComplaints,
      icon: MessageSquare,
      color: 'border-l-yellow-500',
    },
    {
      title: 'Pending Leaves',
      value: overview.pendingLeaves,
      icon: Calendar,
      color: 'border-l-purple-500',
    },
    {
      title: 'Total Rooms',
      value: overview.totalRooms,
      icon: DoorOpen,
      color: 'border-l-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Warden Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <stat.icon className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        ))}
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
                    <p className="text-xs text-gray-500">{formatDate(complaint.createdAt)}</p>
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

        {/* Recent Leave Requests */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Pending Leave Requests</h3>
          <div className="space-y-3">
            {recentLeaves.length > 0 ? (
              recentLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{leave.studentId?.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                    </p>
                    <p className="text-xs text-gray-500">{leave.numberOfDays} days</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No pending leaves</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;