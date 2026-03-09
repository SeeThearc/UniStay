import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Eye, Clock, CheckCircle, AlertCircle, Send, Tag, Zap } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor, COMPLAINT_CATEGORIES } from '../../utils/constants';

const ic = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent";
const lc = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";
const priorityColor = { Low: 'bg-slate-100 text-slate-600', Medium: 'bg-amber-50 text-amber-700', High: 'bg-rose-50 text-rose-700' };

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comment, setComment] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Maintenance', priority: 'Medium' });

  useEffect(() => { fetchComplaints(); }, []);
  const fetchComplaints = async () => {
    try { const r = await axios.get('/complaints/my'); setComplaints(r.data.data); }
    catch { toast.error('Failed to fetch complaints'); }
    finally { setLoading(false); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await axios.post('/complaints', formData); toast.success('Complaint submitted'); fetchComplaints(); closeModal(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const handleAddComment = async (e) => {
    e.preventDefault();
    try { await axios.post(`/complaints/${selectedComplaint._id}/comments`, { comment }); toast.success('Comment added'); setComment(''); const r = await axios.get(`/complaints/${selectedComplaint._id}`); setSelectedComplaint(r.data.data); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const viewComplaint = async (c) => {
    try { const r = await axios.get(`/complaints/${c._id}`); setSelectedComplaint(r.data.data); setShowDetailsModal(true); }
    catch { toast.error('Failed to load details'); }
  };
  const closeModal = () => { setShowModal(false); setFormData({ title: '', description: '', category: 'Maintenance', priority: 'Medium' }); };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Complaints</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage your submitted complaints</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm">
          <Plus className="h-4 w-4" /> New Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: complaints.length, icon: MessageSquare, accent: 'bg-indigo-500' },
          { label: 'Pending', value: complaints.filter(c => c.status === 'Pending').length, icon: Clock, accent: 'bg-amber-500' },
          { label: 'In Progress', value: complaints.filter(c => c.status === 'In Progress').length, icon: AlertCircle, accent: 'bg-blue-500' },
          { label: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length, icon: CheckCircle, accent: 'bg-emerald-500' },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${accent}`}><Icon className="h-4 w-4 text-white" /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {complaints.length > 0 ? complaints.map(c => (
          <div key={c._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{c.ticketId}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priorityColor[c.priority] || 'bg-slate-100 text-slate-600'}`}>{c.priority}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{c.category}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">{c.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-2">{c.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{formatDate(c.createdAt)}</span><span>·</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{c.comments?.length || 0} comments</span>
                </div>
              </div>
              <button onClick={() => viewComplaint(c)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors shrink-0">
                <Eye className="h-3.5 w-3.5" /> View
              </button>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No Complaints Yet</h3>
            <p className="text-sm text-slate-400 mb-5">Raise a complaint if you face any issues in the hostel</p>
            <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              Raise Your First Complaint
            </button>
          </div>
        )}
      </div>

      {/* New Complaint Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Raise New Complaint">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={lc}>Title</label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className={ic} placeholder="Brief title for your complaint" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}><Tag className="inline h-3 w-3 mr-1" />Category</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={ic}>
                {COMPLAINT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}><Zap className="inline h-3 w-3 mr-1" />Priority</label>
              <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className={ic}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
          </div>
          <div>
            <label className={lc}>Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required className={ic} rows="4" placeholder="Describe your complaint in detail…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-95">Submit Complaint</button>
            <button type="button" onClick={closeModal} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Complaint Details" size="lg">
        {selectedComplaint && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Ticket ID', <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{selectedComplaint.ticketId}</span>],
                ['Status', <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(selectedComplaint.status)}`}>{selectedComplaint.status}</span>],
                ['Category', selectedComplaint.category],
                ['Priority', selectedComplaint.priority],
                ['Created', formatDate(selectedComplaint.createdAt)],
                ...(selectedComplaint.resolvedAt ? [['Resolved', formatDate(selectedComplaint.resolvedAt)]] : []),
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">{k}</p>
                  <div className="text-sm font-semibold text-slate-800">{v}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedComplaint.description}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Comments ({selectedComplaint.comments?.length || 0})</p>
              <div className="space-y-2 max-h-52 overflow-y-auto mb-3">
                {selectedComplaint.comments?.map((c, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex justify-between mb-1"><span className="text-xs font-semibold text-slate-700">{c.user?.name}</span><span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span></div>
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyComplaints;