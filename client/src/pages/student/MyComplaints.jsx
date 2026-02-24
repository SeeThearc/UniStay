import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Eye } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor, COMPLAINT_CATEGORIES } from '../../utils/constants';

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comment, setComment] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Maintenance',
    priority: 'Medium',
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get('/complaints/my');
      setComplaints(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/complaints', formData);
      toast.success('Complaint submitted successfully');
      fetchComplaints();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const viewComplaint = async (complaint) => {
    try {
      const response = await axios.get(`/complaints/${complaint._id}`);
      setSelectedComplaint(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load complaint details');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      title: '',
      description: '',
      category: 'Maintenance',
      priority: 'Medium',
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-gray-600 mt-2">Track and manage your complaints</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Total</h3>
          <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {complaints.filter(c => c.status === 'Pending').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">In Progress</h3>
          <p className="text-3xl font-bold text-blue-600">
            {complaints.filter(c => c.status === 'In Progress').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-600 mb-1">Resolved</h3>
          <p className="text-3xl font-bold text-green-600">
            {complaints.filter(c => c.status === 'Resolved').length}
          </p>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length > 0 ? (
          complaints.map((complaint) => (
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
                    <span>{formatDate(complaint.createdAt)}</span>
                    <span>•</span>
                    <span className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {complaint.comments?.length || 0} comments
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => viewComplaint(complaint)}
                  className="btn-primary text-sm flex items-center ml-4"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Complaints Yet</h3>
            <p className="text-gray-600 mb-4">You haven't raised any complaints.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Raise Your First Complaint
            </button>
          </div>
        )}
      </div>

      {/* New Complaint Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Raise New Complaint">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="input-field"
              placeholder="Brief title for your complaint"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input-field"
            >
              {COMPLAINT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="input-field"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="input-field"
              rows="4"
              placeholder="Describe your complaint in detail"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 btn-primary">
              Submit Complaint
            </button>
            <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Complaint Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
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
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{selectedComplaint.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="font-medium">{selectedComplaint.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-medium">{formatDate(selectedComplaint.createdAt)}</p>
                </div>
                {selectedComplaint.resolvedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Resolved At</p>
                    <p className="font-medium">{formatDate(selectedComplaint.resolvedAt)}</p>
                  </div>
                )}
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyComplaints;