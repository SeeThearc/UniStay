import { useState, useEffect } from 'react';
import { Search, MessageSquare, Eye } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '../../utils/constants';

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get('/complaints');
      setComplaints(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await axios.put(`/complaints/${complaintId}/status`, { status: newStatus });
      toast.success('Status updated successfully');
      fetchComplaints();
      if (selectedComplaint?._id === complaintId) {
        const response = await axios.get(`/complaints/${complaintId}`);
        setSelectedComplaint(response.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/complaints/${selectedComplaint._id}/comments`, { comment });
      toast.success('Comment added successfully');
      setComment('');
      const response = await axios.get(`/complaints/${selectedComplaint._id}`);
      setSelectedComplaint(response.data.data);
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const viewComplaint = async (complaint) => {
    try {
      const response = await axios.get(`/complaints/${complaint._id}`);
      setSelectedComplaint(response.data.data);
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load complaint details');
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = 
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.studentId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <Loader fullScreen />;

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Complaints</h1>
        <p className="text-gray-600 mt-2">View and manage student complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Total Complaints</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">In Progress</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Resolved</h3>
          <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search complaints..."
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
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <div key={complaint._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm font-mono text-gray-500">{complaint.ticketId}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                    {complaint.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {complaint.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{complaint.title}</h3>
                <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>By: {complaint.studentId?.name}</span>
                  <span>•</span>
                  <span>{formatDate(complaint.createdAt)}</span>
                  <span>•</span>
                  <span>{complaint.comments?.length || 0} comments</span>
                </div>
              </div>
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => viewComplaint(complaint)}
                  className="btn-primary text-sm flex items-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
                {complaint.status !== 'Resolved' && (
                  <select
                    value={complaint.status}
                    onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Complaint Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Complaint Details"
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ticket ID</p>
                  <p className="font-medium">{selectedComplaint.ticketId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Student</p>
                  <p className="font-medium">{selectedComplaint.studentId?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{selectedComplaint.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-medium">{formatDate(selectedComplaint.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="font-medium">{selectedComplaint.priority}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-gray-700">{selectedComplaint.description}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Comments ({selectedComplaint.comments?.length || 0})</h4>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {selectedComplaint.comments?.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{comment.user?.name}</span>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Add a comment..."
                  required
                />
                <button type="submit" className="btn-primary">
                  Add Comment
                </button>
              </form>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={() => handleStatusChange(selectedComplaint._id, 'In Progress')}
                className="flex-1 btn-primary"
                disabled={selectedComplaint.status === 'In Progress'}
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleStatusChange(selectedComplaint._id, 'Resolved')}
                className="flex-1 btn-success"
                disabled={selectedComplaint.status === 'Resolved'}
              >
                Mark Resolved
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewComplaints;