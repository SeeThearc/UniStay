import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor, LEAVE_TYPES } from '../../utils/constants';

const ic = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent";
const lc = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ fromDate: '', toDate: '', reason: '', leaveType: 'Personal' });

  useEffect(() => { fetchLeaves(); }, []);
  const fetchLeaves = async () => {
    try { const r = await axios.get('/leaves/my'); setLeaves(r.data.data); }
    catch { toast.error('Failed to fetch leaves'); }
    finally { setLoading(false); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.fromDate) > new Date(formData.toDate)) { toast.error('End date must be after start date'); return; }
    setSubmitting(true);
    try { await axios.post('/leaves', formData); toast.success('Leave application submitted'); fetchLeaves(); closeModal(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leave request?')) return;
    try { await axios.delete(`/leaves/${id}`); toast.success('Leave deleted'); fetchLeaves(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  const closeModal = () => { setShowModal(false); setFormData({ fromDate: '', toDate: '', reason: '', leaveType: 'Personal' }); };

  if (loading) return <Loader fullScreen />;

  const leaveTypeColor = { Personal: 'bg-indigo-50 text-indigo-700', Medical: 'bg-rose-50 text-rose-700', Emergency: 'bg-red-50 text-red-700', Academic: 'bg-blue-50 text-blue-700', Other: 'bg-slate-100 text-slate-600' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Leaves</h1>
          <p className="text-sm text-slate-500 mt-0.5">Apply and track your leave applications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm">
          <Plus className="h-4 w-4" /> Apply Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: leaves.length, icon: Calendar, accent: 'bg-indigo-500' },
          { label: 'Pending', value: leaves.filter(l => l.status === 'Pending').length, icon: Clock, accent: 'bg-amber-500' },
          { label: 'Approved', value: leaves.filter(l => l.status === 'Approved').length, icon: CheckCircle, accent: 'bg-emerald-500' },
          { label: 'Rejected', value: leaves.filter(l => l.status === 'Rejected').length, icon: XCircle, accent: 'bg-rose-500' },
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
        {leaves.length > 0 ? leaves.map(leave => (
          <div key={leave._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(leave.status)}`}>{leave.status}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${leaveTypeColor[leave.leaveType] || 'bg-slate-100 text-slate-600'}`}>{leave.leaveType}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{leave.numberOfDays} days</span>
                </div>

                {/* Date range */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-slate-50 rounded-xl px-3 py-2 text-center min-w-[80px]">
                    <p className="text-xs text-slate-400">From</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(leave.fromDate)}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                  <div className="bg-slate-50 rounded-xl px-3 py-2 text-center min-w-[80px]">
                    <p className="text-xs text-slate-400">To</p>
                    <p className="text-sm font-bold text-slate-800">{formatDate(leave.toDate)}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Reason:</span> {leave.reason}</p>
                {leave.rejectionReason && (
                  <div className="mt-2 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-rose-600 mb-0.5">Rejection Reason</p>
                    <p className="text-sm text-rose-700">{leave.rejectionReason}</p>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">Applied on {formatDate(leave.createdAt)}</p>
              </div>

              {leave.status === 'Pending' && (
                <button onClick={() => handleDelete(leave._id)} className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl hover:bg-rose-100 transition-colors shrink-0">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No Leave Requests</h3>
            <p className="text-sm text-slate-400 mb-5">Apply for leave whenever you need to go home</p>
            <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              Apply for Leave
            </button>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Apply for Leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={lc}>Leave Type</label>
            <select value={formData.leaveType} onChange={e => setFormData({ ...formData, leaveType: e.target.value })} className={ic}>
              {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>From Date</label>
              <input type="date" value={formData.fromDate} onChange={e => setFormData({ ...formData, fromDate: e.target.value })} required min={new Date().toISOString().split('T')[0]} className={ic} />
            </div>
            <div>
              <label className={lc}>To Date</label>
              <input type="date" value={formData.toDate} onChange={e => setFormData({ ...formData, toDate: e.target.value })} required min={formData.fromDate || new Date().toISOString().split('T')[0]} className={ic} />
            </div>
          </div>
          <div>
            <label className={lc}>Reason</label>
            <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} required className={ic} rows="4" placeholder="Please explain the reason for your leave…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
              {submitting ? (
                <><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Submitting…</>
              ) : 'Submit Application'}
            </button>
            <button type="button" onClick={closeModal} disabled={submitting} className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyLeaves;