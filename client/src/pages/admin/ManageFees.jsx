import { useState, useEffect } from 'react';
import {
  Search, Plus, TrendingUp, IndianRupee,
  Users, AlertCircle, CheckCircle2, Clock,
  CreditCard, Banknote, Landmark, FileText,
  ChevronRight, X
} from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatCurrency, getStatusColor } from '../../utils/constants';

/* ─── tiny helpers ─────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    'Partially Paid': 'bg-amber-50 text-amber-700 ring-amber-200',
    Unpaid: 'bg-red-50 text-red-700 ring-red-200',
  };
  const cls = map[status] || 'bg-gray-50 text-gray-700 ring-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${cls}`}>
      {status}
    </span>
  );
};

const KpiCard = ({ label, value, sub, icon: Icon, accent }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4">
    <div className={`p-3 rounded-xl ${accent}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  </div>
);

/* ─── Main Component ────────────────────────────────────── */
const ManageFees = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [feeStats, setFeeStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    studentId: '', totalFee: '', semester: '', dueDate: '',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '', paymentMethod: 'Cash', transactionId: '', remarks: '',
  });

  useEffect(() => {
    fetchFees();
    fetchStudents();
    fetchFeeStats();
  }, []);

  const fetchFees = async () => {
    try {
      const r = await axios.get('/fees');
      setFees(r.data.data);
    } catch { toast.error('Failed to fetch fees'); }
    finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    try {
      const r = await axios.get('/auth/students');
      setStudents(r.data.data);
    } catch { /* silent */ }
  };

  const fetchFeeStats = async () => {
    try {
      const r = await axios.get('/fees/stats');
      setFeeStats(r.data.data);
    } catch { /* silent */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/fees', formData);
      toast.success('Fee record saved successfully');
      fetchFees(); fetchFeeStats(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSubmitting(false); }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/fees/${selectedFee._id}/payment`, paymentData);
      toast.success('Payment recorded successfully');
      fetchFees(); fetchFeeStats(); closePaymentModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally { setSubmitting(false); }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ studentId: '', totalFee: '', semester: '', dueDate: '' });
  };
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedFee(null);
    setPaymentData({ amount: '', paymentMethod: 'Cash', transactionId: '', remarks: '' });
  };

  const collectionRate = feeStats && feeStats.totalFeeAmount > 0
    ? ((feeStats.totalCollected / feeStats.totalFeeAmount) * 100).toFixed(1)
    : '0.0';

  const filteredFees = fees.filter(fee =>
    fee.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.studentId?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const methodIcon = { Cash: Banknote, Card: CreditCard, 'Online Transfer': Landmark, Cheque: FileText };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fee Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track, collect & manage hostel fee payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Set / Update Fee
        </button>
      </div>

      {/* ── KPI Stats ── */}
      {feeStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Total Fee Assigned"
            value={formatCurrency(feeStats.totalFeeAmount)}
            sub={`${fees.length} student${fees.length !== 1 ? 's' : ''}`}
            icon={IndianRupee}
            accent="bg-indigo-500"
          />
          <KpiCard
            label="Amount Collected"
            value={formatCurrency(feeStats.totalCollected)}
            sub={`${feeStats.paidCount} fully paid`}
            icon={CheckCircle2}
            accent="bg-emerald-500"
          />
          <KpiCard
            label="Pending Dues"
            value={formatCurrency(feeStats.totalPending)}
            sub={`${feeStats.unpaidCount} unpaid · ${feeStats.partiallyPaidCount} partial`}
            icon={AlertCircle}
            accent="bg-rose-500"
          />
          <KpiCard
            label="Collection Rate"
            value={`${collectionRate}%`}
            sub={
              <div className="mt-1 w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(parseFloat(collectionRate), 100)}%` }}
                />
              </div>
            }
            icon={TrendingUp}
            accent="bg-violet-500"
          />
        </div>
      )}

      {/* ── Search ── */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name or ID…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-slate-400"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Student', 'Semester', 'Total Fee', 'Paid', 'Dues', 'Status', 'Action'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No fee records found</p>
                  </td>
                </tr>
              ) : filteredFees.map(fee => (
                <tr key={fee._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-800">{fee.studentId?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fee.studentId?.studentId}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{fee.semester || '—'}</td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-800">{formatCurrency(fee.totalFee)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-emerald-600">{formatCurrency(fee.amountPaid)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-rose-600">{formatCurrency(fee.remainingDues)}</td>
                  <td className="px-5 py-4"><StatusBadge status={fee.status} /></td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => { setSelectedFee(fee); setShowPaymentModal(true); }}
                      disabled={fee.status === 'Paid'}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Payment <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredFees.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400">{filteredFees.length} record{filteredFees.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* ── Set Fee Modal ── */}
      <Modal isOpen={showModal} onClose={closeModal} title="Set / Update Student Fee">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Select Student
            </label>
            <select
              value={formData.studentId}
              onChange={e => setFormData({ ...formData, studentId: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            >
              <option value="">— Choose a student —</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>
              ))}
            </select>
          </div>

          {/* Total Fee */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Total Fee Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
              <input
                type="number" min="0"
                value={formData.totalFee}
                onChange={e => setFormData({ ...formData, totalFee: e.target.value })}
                required
                placeholder="e.g. 45000"
                className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Semester + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Semester
              </label>
              <input
                type="text"
                value={formData.semester}
                onChange={e => setFormData({ ...formData, semester: e.target.value })}
                placeholder="e.g. Sem 5 / Fall 2025"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
            >
              {submitting ? 'Saving…' : 'Save Fee Record'}
            </button>
            <button type="button" onClick={closeModal}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Record Payment Modal ── */}
      <Modal isOpen={showPaymentModal} onClose={closePaymentModal} title="Record Payment">
        {selectedFee && (
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            {/* Student info panel */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-sm font-bold text-indigo-900">{selectedFee.studentId?.name}</p>
              <p className="text-xs text-indigo-500 mt-0.5">{selectedFee.studentId?.studentId}</p>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="text-xs text-indigo-400">Total Fee</p>
                  <p className="text-sm font-semibold text-indigo-800">{formatCurrency(selectedFee.totalFee)}</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-400">Paid So Far</p>
                  <p className="text-sm font-semibold text-emerald-700">{formatCurrency(selectedFee.amountPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-400">Remaining</p>
                  <p className="text-sm font-semibold text-rose-700">{formatCurrency(selectedFee.remainingDues)}</p>
                </div>
              </div>
              {/* mini progress bar */}
              <div className="mt-3 bg-indigo-100 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min((selectedFee.amountPaid / selectedFee.totalFee) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Payment Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                <input
                  type="number" min="1" max={selectedFee.remainingDues}
                  value={paymentData.amount}
                  onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  placeholder={`Max ₹${selectedFee.remainingDues}`}
                  className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Cash', 'Card', 'Online Transfer', 'Cheque'].map(m => {
                  const Icon = methodIcon[m];
                  return (
                    <button
                      key={m} type="button"
                      onClick={() => setPaymentData({ ...paymentData, paymentMethod: m })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        paymentData.paymentMethod === m
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Transaction / Receipt ID <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={paymentData.transactionId}
                onChange={e => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                placeholder="e.g. TXN20250305"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Remarks <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={paymentData.remarks}
                onChange={e => setPaymentData({ ...paymentData, remarks: e.target.value })}
                placeholder="Any notes about this payment…"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit" disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
              >
                {submitting ? 'Recording…' : 'Record Payment'}
              </button>
              <button type="button" onClick={closePaymentModal}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-xl transition-all">
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ManageFees;