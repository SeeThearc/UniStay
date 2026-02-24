import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor, LEAVE_TYPES } from '../../utils/constants';

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
    leaveType: 'Personal',
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('/leaves/my');
      setLeaves(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dates
    const from = new Date(formData.fromDate);
    const to = new Date(formData.toDate);

    if (from > to) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      await axios.post('/leaves', formData);
      toast.success('Leave application submitted successfully');
      fetchLeaves();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await axios.delete(`/leaves/${id}`);
        toast.success('Leave request deleted successfully');
        fetchLeaves();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete leave');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      fromDate: '',
      toDate: '',
      reason: '',
      leaveType: 'Personal',
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="text-gray-600 mt-2">Apply and track your leave applications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Apply Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Total</h3>
          <p className="text-3xl font-bold text-gray-900">{leaves.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {leaves.filter(l => l.status === 'Pending').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Approved</h3>
          <p className="text-3xl font-bold text-green-600">
            {leaves.filter(l => l.status === 'Approved').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Rejected</h3>
          <p className="text-3xl font-bold text-red-600">
            {leaves.filter(l => l.status === 'Rejected').length}
          </p>
        </div>
      </div>

      {/* Leaves List */}
      <div className="space-y-4">
        {leaves.length > 0 ? (
          leaves.map((leave) => (
            <div key={leave._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {leave.leaveType}
                    </span>
                    <span className="text-sm text-gray-500">{leave.numberOfDays} days</span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">From:</span> {formatDate(leave.fromDate)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">To:</span> {formatDate(leave.toDate)}
                    </p>
                  </div>
                  <p className="text-gray-700 mb-2"><span className="font-medium">Reason:</span> {leave.reason}</p>
                  {leave.rejectionReason && (
                    <p className="text-red-600 text-sm">
                      <span className="font-medium">Rejection Reason:</span> {leave.rejectionReason}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Applied on {formatDate(leave.createdAt)}
                  </p>
                </div>
                {leave.status === 'Pending' && (
                  <button
                    onClick={() => handleDelete(leave._id)}
                    className="btn-danger text-sm flex items-center ml-4"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leave Requests</h3>
            <p className="text-gray-600 mb-4">You haven't applied for any leave yet.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Apply for Your First Leave
            </button>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Apply for Leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              className="input-field"
            >
              {LEAVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={formData.fromDate}
                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={formData.toDate}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                required
                min={formData.fromDate || new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              className="input-field"
              rows="4"
              placeholder="Please explain the reason for your leave"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 btn-primary">
              Submit Application
            </button>
            <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyLeaves;