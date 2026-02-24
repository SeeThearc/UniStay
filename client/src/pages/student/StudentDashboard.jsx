import { useState, useEffect } from 'react';
import { Home, MessageSquare, Calendar, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import { formatDate, formatCurrency, getStatusColor } from '../../utils/constants';

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard/student');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const { profile, roomDetails, feeDetails, complaintStats, leaveStats, recentComplaints, recentLeaves } = dashboardData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile.name}!</h1>
        <p className="text-gray-600 mt-2">Here's your hostel dashboard</p>
      </div>

      {/* Profile Overview */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm opacity-90">Student ID</p>
            <p className="text-lg font-semibold">{profile.studentId}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Email</p>
            <p className="text-lg font-semibold">{profile.email}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Phone</p>
            <p className="text-lg font-semibold">{profile.phoneNumber || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Room</p>
            <p className="text-lg font-semibold">
              {roomDetails ? `Room ${roomDetails.roomNumber}` : 'Not assigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/student/room" className="stat-card border-l-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">My Room</p>
              <p className="text-2xl font-bold text-gray-900">
                {roomDetails ? roomDetails.roomNumber : 'N/A'}
              </p>
            </div>
            <Home className="h-8 w-8 text-blue-600" />
          </div>
        </Link>

        <Link to="/student/complaints" className="stat-card border-l-yellow-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">My Complaints</p>
              <p className="text-2xl font-bold text-gray-900">{complaintStats.total}</p>
              <p className="text-xs text-gray-500">{complaintStats.pending} pending</p>
            </div>
            <MessageSquare className="h-8 w-8 text-yellow-600" />
          </div>
        </Link>

        <Link to="/student/leaves" className="stat-card border-l-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">My Leaves</p>
              <p className="text-2xl font-bold text-gray-900">{leaveStats.total}</p>
              <p className="text-xs text-gray-500">{leaveStats.pending} pending</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </Link>

        <Link to="/student/fees" className="stat-card border-l-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Fee Status</p>
              <p className="text-2xl font-bold text-gray-900">
                {feeDetails ? feeDetails.status : 'N/A'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Link>
      </div>

      {/* Room Details */}
      {roomDetails && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Room Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Room Number</p>
              <p className="font-medium">{roomDetails.roomNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Block</p>
              <p className="font-medium">{roomDetails.block}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Floor</p>
              <p className="font-medium">{roomDetails.floor}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Occupancy</p>
              <p className="font-medium">{roomDetails.occupants?.length} / {roomDetails.capacity}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fee Details */}
      {feeDetails && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Fee Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Fee</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(feeDetails.totalFee)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Paid</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(feeDetails.amountPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining Dues</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(feeDetails.remainingDues)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(feeDetails.status)}`}>
                {feeDetails.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Complaints</h3>
            <Link to="/student/complaints" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentComplaints.length > 0 ? (
              recentComplaints.map((complaint) => (
                <div key={complaint._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{complaint.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(complaint.createdAt)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No complaints yet</p>
            )}
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Leave Requests</h3>
            <Link to="/student/leaves" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentLeaves.length > 0 ? (
              recentLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{leave.numberOfDays} Days</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No leave requests yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;