import { useState, useEffect } from 'react';
import {
  IndianRupee, Calendar, CreditCard, Banknote,
  Landmark, FileText, CheckCircle2, Clock, AlertTriangle,
  BookOpen, TrendingUp, Wallet
} from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../utils/constants';

/* ─── Circular progress SVG ───────────────────────────── */
const CircleProgress = ({ pct }) => {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke="white" strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="55" y="51" textAnchor="middle" fill="white" fontSize="15" fontWeight="700">{pct.toFixed(0)}%</text>
      <text x="55" y="66" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">Paid</text>
    </svg>
  );
};

/* ─── KPI mini card ───────────────────────────────────── */
const KpiCard = ({ label, value, icon: Icon, accent, textAccent }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2.5 rounded-xl ${accent}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
    </div>
    <p className={`text-2xl font-bold ${textAccent}`}>{value}</p>
  </div>
);

/* ─── Payment method icon ─────────────────────────────── */
const methodIconMap = { Cash: Banknote, Card: CreditCard, 'Online Transfer': Landmark, Cheque: FileText };
const MethodIcon = ({ method }) => {
  const Icon = methodIconMap[method] || Wallet;
  return <Icon className="h-4 w-4 text-slate-400" />;
};

/* ─── Main Component ────────────────────────────────────── */
const MyFees = () => {
  const [feeDetails, setFeeDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFeeDetails(); }, []);

  const fetchFeeDetails = async () => {
    try {
      const r = await axios.get('/fees/my');
      setFeeDetails(r.data.data);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to fetch fee details');
    } finally { setLoading(false); }
  };

  if (loading) return <Loader fullScreen />;

  /* ── No fee record ── */
  if (!feeDetails) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center">
          <IndianRupee className="h-10 w-10 text-indigo-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Fee Record Yet</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Your fee details haven't been set up yet.<br />Please contact the hostel administrator.
        </p>
      </div>
    </div>
  );

  const pct = feeDetails.totalFee > 0
    ? (feeDetails.amountPaid / feeDetails.totalFee) * 100
    : 0;

  const isDue = feeDetails.remainingDues > 0;
  const isOverdue = feeDetails.dueDate && new Date(feeDetails.dueDate) < new Date() && isDue;

  const statusConfig = {
    Paid: { bg: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-100', icon: CheckCircle2 },
    'Partially Paid': { bg: 'bg-amber-500', text: 'text-amber-700 bg-amber-100', icon: Clock },
    Unpaid: { bg: 'bg-rose-500', text: 'text-rose-700 bg-rose-100', icon: AlertTriangle },
  };
  const si = statusConfig[feeDetails.status] || statusConfig.Unpaid;
  const SIcon = si.icon;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      {/* ── Page title ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Fee Details</h1>
        <p className="text-sm text-slate-500 mt-0.5">Hostel fee payment overview for {feeDetails.semester || 'Current Semester'}</p>
      </div>

      {/* ── Hero Banner ── */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 shadow-lg p-6 mb-6 overflow-hidden relative">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 right-16 h-28 w-28 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <CircleProgress pct={pct} />
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white`}>
                <SIcon className="h-3.5 w-3.5" />
                {feeDetails.status}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/80 text-white">
                  ⚡ Overdue
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold leading-none">{formatCurrency(feeDetails.amountPaid)}</h2>
            <p className="text-white/70 text-sm mt-1">paid of {formatCurrency(feeDetails.totalFee)} total</p>

            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <p className="text-white/60 text-xs">Semester</p>
                <p className="text-white font-semibold text-sm">{feeDetails.semester || '—'}</p>
              </div>
              {feeDetails.dueDate && (
                <div>
                  <p className="text-white/60 text-xs">Due Date</p>
                  <p className={`font-semibold text-sm ${isOverdue ? 'text-rose-300' : 'text-white'}`}>
                    {formatDate(feeDetails.dueDate)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-white/60 text-xs">Last Updated</p>
                <p className="text-white font-semibold text-sm">{formatDate(feeDetails.lastUpdated)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total Fee" value={formatCurrency(feeDetails.totalFee)} icon={IndianRupee} accent="bg-indigo-500" textAccent="text-slate-800" />
        <KpiCard label="Amount Paid" value={formatCurrency(feeDetails.amountPaid)} icon={CheckCircle2} accent="bg-emerald-500" textAccent="text-emerald-600" />
        <KpiCard label="Remaining Dues" value={formatCurrency(feeDetails.remainingDues)} icon={AlertTriangle} accent="bg-rose-500" textAccent="text-rose-600" />
      </div>

      {/* ── Payment History ── */}
      {feeDetails.paymentHistory?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-700">Payment History</h3>
            <span className="ml-auto text-xs text-slate-400">{feeDetails.paymentHistory.length} transaction{feeDetails.paymentHistory.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['#', 'Date', 'Amount', 'Method', 'Transaction ID', 'Remarks'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...feeDetails.paymentHistory].reverse().map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                      #{feeDetails.paymentHistory.length - i}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block bg-emerald-50 text-emerald-700 text-sm font-bold px-2.5 py-0.5 rounded-lg">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MethodIcon method={p.paymentMethod} />
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">
                      {p.transactionId || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {p.remarks || <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Reminder Banner ── */}
      {isDue && (
        <div className={`rounded-2xl border p-5 flex items-start gap-4 ${isOverdue ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${isOverdue ? 'bg-rose-100' : 'bg-amber-100'}`}>
            <AlertTriangle className={`h-5 w-5 ${isOverdue ? 'text-rose-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h4 className={`font-bold text-sm mb-1 ${isOverdue ? 'text-rose-800' : 'text-amber-800'}`}>
              {isOverdue ? 'Payment Overdue!' : 'Payment Reminder'}
            </h4>
            <p className={`text-sm leading-relaxed ${isOverdue ? 'text-rose-700' : 'text-amber-700'}`}>
              You have pending dues of <strong>{formatCurrency(feeDetails.remainingDues)}</strong>.
              {isOverdue
                ? ' Your payment deadline has passed. Please contact the hostel office immediately.'
                : ' Please visit the hostel office to clear your dues before the due date.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFees;