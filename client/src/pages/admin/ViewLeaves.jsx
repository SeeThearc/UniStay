import { useState, useEffect } from 'react';
import { Search, Calendar, Check, X } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '../../utils/constants';

const ViewLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('/leaves');
      setLeaves(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      await axios.put(`/leaves/${leaveId}/status`, { status: 'Approved' });
      toast.success('Leave approved successfully');
      fetchLeaves();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleReject = async (leaveId) => {
    try {
      await axios.put(`/leaves/${leaveId}/status`, {
        status: 'Rejected',
        rejectionReason,
      });
      toast.success('Leave rejected');
      fetchLeaves();
      setShowModal(false);
      setRejectionReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject leave');
    }
  };

  const viewLeave = async (leave) => {
    setSelectedLeave(leave);
    setShowModal(true);
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = 
      leave.studentId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.studentId?.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || leave.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <Loader fullScreen />;

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
        <p className="text-gray-600 mt-2">Manage student leave applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Total Requests</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Approved</h3>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Rejected</h3>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search leaves..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Leaves List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{leave.studentId?.name}</div>
                    <div className="text-sm text-gray-500">{leave.studentId?.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{leave.numberOfDays} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{leave.leaveType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => viewLeave(leave)}
                      className="text-primary-600 hover:text-primary-900 font-medium"
                    >
                      View
                    </button>
                    {leave.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(leave._id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => viewLeave(leave)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setRejectionReason('');
        }}
        title="Leave Request Details"
      >
        {selectedLeave && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Student Name</p>
                  <p className="font-medium">{selectedLeave.studentId?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="font-medium">{selectedLeave.studentId?.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">From Date</p>
                  <p className="font-medium">{formatDate(selectedLeave.fromDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Date</p>
                  <p className="font-medium">{formatDate(selectedLeave.toDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number of Days</p>
                  <p className="font-medium">{selectedLeave.numberOfDays} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Leave Type</p>
                  <p className="font-medium">{selectedLeave.leaveType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLeave.status)}`}>
                    {selectedLeave.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Applied On</p>
                  <p className="font-medium">{formatDate(selectedLeave.createdAt)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Reason</h4>
              <p className="text-gray-700">{selectedLeave.reason}</p>
            </div>

            {selectedLeave.status === 'Rejected' && selectedLeave.rejectionReason && (
              <div>
                <h4 className="font-semibold mb-2">Rejection Reason</h4>
                <p className="text-red-700">{selectedLeave.rejectionReason}</p>
              </div>
            )}

            {selectedLeave.status === 'Pending' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="input-field"
                    rows="3"
                    placeholder="Enter reason for rejection..."
                  />
                </div>

                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedLeave._id)}
                    className="flex-1 btn-success flex items-center justify-center"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedLeave._id)}
                    className="flex-1 btn-danger flex items-center justify-center"
                    disabled={!rejectionReason}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewLeaves;