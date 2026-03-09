import { useState, useEffect } from 'react';
import { Search, MessageSquare, Eye, CheckCircle, Clock, AlertCircle, XCircle, Send } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '../../utils/constants';

const ic = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent";

const priorityColor = { Low: 'bg-slate-100 text-slate-600', Medium: 'bg-amber-50 text-amber-700', High: 'bg-rose-50 text-rose-700', Critical: 'bg-red-100 text-red-800' };

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [comment, setComment] = useState('');

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    try { const r = await axios.get('/complaints'); setComplaints(r.data.data); }
    catch { toast.error('Failed to fetch complaints'); }
    finally { setLoading(false); }
  };
  const handleStatusChange = async (id, status) => {
    try { await axios.put(`/complaints/${id}/status`, { status }); toast.success('Status updated'); fetchComplaints(); if (selectedComplaint?._id === id) { const r = await axios.get(`/complaints/${id}`); setSelectedComplaint(r.data.data); } }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };
  const handleAddComment = async (e) => {
    e.preventDefault();
    try { await axios.post(`/complaints/${selectedComplaint._id}/comments`, { comment }); toast.success('Comment added'); setComment(''); const r = await axios.get(`/complaints/${selectedComplaint._id}`); setSelectedComplaint(r.data.data); fetchComplaints(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };
  const viewComplaint = async (c) => {
    try { const r = await axios.get(`/complaints/${c._id}`); setSelectedComplaint(r.data.data); setShowModal(true); }
    catch { toast.error('Failed to load details'); }
  };

  const filtered = complaints.filter(c => {
    const s = searchTerm.toLowerCase();
    return (c.title.toLowerCase().includes(s) || c.studentId?.name.toLowerCase().includes(s) || c.ticketId.toLowerCase().includes(s)) && (statusFilter === 'All' || c.status === statusFilter);
  });

  if (loading) return <Loader fullScreen />;
  const stats = { total: complaints.length, pending: complaints.filter(c => c.status === 'Pending').length, inProgress: complaints.filter(c => c.status === 'In Progress').length, resolved: complaints.filter(c => c.status === 'Resolved').length };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Complaints</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and respond to student complaints</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: MessageSquare, accent: 'bg-indigo-500' },
          { label: 'Pending', value: stats.pending, icon: Clock, accent: 'bg-amber-500' },
          { label: 'In Progress', value: stats.inProgress, icon: AlertCircle, accent: 'bg-blue-500' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, accent: 'bg-emerald-500' },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${accent}`}><Icon className="h-4 w-4 text-white" /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input type="text" placeholder="Search by title, student, ticket ID…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Pending', 'In Progress', 'Resolved'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map(complaint => (
          <div key={complaint._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{complaint.ticketId}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(complaint.status)}`}>{complaint.status}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityColor[complaint.priority] || 'bg-slate-100 text-slate-600'}`}>{complaint.priority}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{complaint.category}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">{complaint.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-2">{complaint.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>By <span className="font-medium text-slate-600">{complaint.studentId?.name}</span></span>
                  <span>·</span><span>{formatDate(complaint.createdAt)}</span>
                  <span>·</span><span>{complaint.comments?.length || 0} comments</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => viewComplaint(complaint)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
                {complaint.status !== 'Resolved' && (
                  <select value={complaint.status} onChange={e => handleStatusChange(complaint._id, e.target.value)} className="text-xs border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option>Pending</option><option>In Progress</option><option>Resolved</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No complaints found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Complaint Details" size="lg">
        {selectedComplaint && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Ticket ID', <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{selectedComplaint.ticketId}</span>],
                ['Status', <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(selectedComplaint.status)}`}>{selectedComplaint.status}</span>],
                ['Student', selectedComplaint.studentId?.name],
                ['Category', selectedComplaint.category],
                ['Priority', selectedComplaint.priority],
                ['Created', formatDate(selectedComplaint.createdAt)],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <div className="text-sm font-semibold text-slate-800">{val}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedComplaint.description}</p>
            </div>

            {/* Comments */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Comments ({selectedComplaint.comments?.length || 0})</p>
              <div className="space-y-2 max-h-52 overflow-y-auto mb-3">
                {selectedComplaint.comments?.map((c, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{c.user?.name}</span>
                      <span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600">{c.comment}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment…" required className={`flex-1 ${ic}`} />
                <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 flex items-center gap-1.5 transition-colors">
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </form>
            </div>

            {selectedComplaint.status !== 'Resolved' && (
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button onClick={() => handleStatusChange(selectedComplaint._id, 'In Progress')} disabled={selectedComplaint.status === 'In Progress'} className="flex-1 py-2.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors">Mark In Progress</button>
                <button onClick={() => handleStatusChange(selectedComplaint._id, 'Resolved')} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-colors">Mark Resolved</button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ViewComplaints;