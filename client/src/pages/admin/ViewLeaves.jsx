import { useState, useEffect } from 'react';
import { Search, Calendar, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatDate, getStatusColor } from '../../utils/constants';

const ic = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent";

const ViewLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => { fetchLeaves(); }, []);
  const fetchLeaves = async () => {
    try { const r = await axios.get('/leaves'); setLeaves(r.data.data); }
    catch { toast.error('Failed to fetch leaves'); }
    finally { setLoading(false); }
  };
  const handleApprove = async (id) => {
    try { await axios.put(`/leaves/${id}/status`, { status: 'Approved' }); toast.success('Leave approved'); fetchLeaves(); setShowModal(false); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };
  const handleReject = async (id) => {
    try { await axios.put(`/leaves/${id}/status`, { status: 'Rejected', rejectionReason }); toast.success('Leave rejected'); fetchLeaves(); setShowModal(false); setRejectionReason(''); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const filtered = leaves.filter(l => {
    const s = searchTerm.toLowerCase();
    return (l.studentId?.name.toLowerCase().includes(s) || l.studentId?.studentId?.toLowerCase().includes(s)) && (statusFilter === 'All' || l.status === statusFilter);
  });

  if (loading) return <Loader fullScreen />;
  const stats = { total: leaves.length, pending: leaves.filter(l => l.status === 'Pending').length, approved: leaves.filter(l => l.status === 'Approved').length, rejected: leaves.filter(l => l.status === 'Rejected').length };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leave Requests</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage student leave applications</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Calendar, accent: 'bg-indigo-500' },
          { label: 'Pending', value: stats.pending, icon: Clock, accent: 'bg-amber-500' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, accent: 'bg-emerald-500' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, accent: 'bg-rose-500' },
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
            <input type="text" placeholder="Search by student name or ID…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Student', 'Duration', 'Days', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? filtered.map(leave => (
                <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800">{leave.studentId?.name}</p>
                    <p className="text-xs text-slate-400">{leave.studentId?.studentId}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-700">{formatDate(leave.fromDate)}</p>
                    <p className="text-xs text-slate-400">→ {formatDate(leave.toDate)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-slate-800">{leave.numberOfDays}d</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">{leave.leaveType}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(leave.status)}`}>{leave.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedLeave(leave); setShowModal(true); }} className="text-xs font-semibold px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">View</button>
                      {leave.status === 'Pending' && (
                        <>
                          <button onClick={() => handleApprove(leave._id)} className="text-xs font-semibold px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1">
                            <Check className="h-3 w-3" /> Approve
                          </button>
                          <button onClick={() => { setSelectedLeave(leave); setShowModal(true); }} className="text-xs font-semibold px-2.5 py-1.5 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1">
                            <X className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No leave requests found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setRejectionReason(''); }} title="Leave Request Details">
        {selectedLeave && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Student', selectedLeave.studentId?.name],
                ['Student ID', selectedLeave.studentId?.studentId],
                ['From', formatDate(selectedLeave.fromDate)],
                ['To', formatDate(selectedLeave.toDate)],
                ['Days', `${selectedLeave.numberOfDays} days`],
                ['Type', selectedLeave.leaveType],
                ['Status', <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(selectedLeave.status)}`}>{selectedLeave.status}</span>],
                ['Applied On', formatDate(selectedLeave.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">{k}</p>
                  <div className="text-sm font-semibold text-slate-800">{v}</div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Reason</p>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedLeave.reason}</p>
            </div>

            {selectedLeave.status === 'Rejected' && selectedLeave.rejectionReason && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-1">Rejection Reason</p>
                <p className="text-sm text-rose-700">{selectedLeave.rejectionReason}</p>
              </div>
            )}

            {selectedLeave.status === 'Pending' && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Rejection Reason <span className="text-slate-400 font-normal normal-case">(required to reject)</span></label>
                  <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className={ic} rows="3" placeholder="Enter reason if rejecting…" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleApprove(selectedLeave._id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => handleReject(selectedLeave._id)} disabled={!rejectionReason} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors">
                    <X className="h-4 w-4" /> Reject
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