import { useState, useEffect } from 'react';
import { Home, MessageSquare, Calendar, IndianRupee, ArrowUpRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import { formatDate, formatCurrency, getStatusColor } from '../../utils/constants';

const QuickCard = ({ to, icon: Icon, label, value, sub, accent }) => (
  <Link to={to} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${accent}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
    </div>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
    <p className="text-xl font-bold text-slate-800 mt-0.5">{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </Link>
);

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const r = await axios.get('/dashboard/student');
      setDashboardData(r.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <Loader fullScreen />;

  const { profile, roomDetails, feeDetails, complaintStats, leaveStats, recentComplaints, recentLeaves } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-28 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold">{profile.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <p className="text-white/70 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white">{profile.name} 👋</h1>
          </div>
        </div>
        {/* Profile info chips */}
        <div className="relative mt-5 flex flex-wrap gap-3">
          {[
            { label: 'Student ID', value: profile.studentId },
            { label: 'Room', value: roomDetails ? `Room ${roomDetails.roomNumber}` : 'Not assigned' },
            { label: 'Phone', value: profile.phoneNumber || 'Not provided' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
              <p className="text-white/60 text-xs">{label}</p>
              <p className="text-white text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickCard to="/student/room" icon={Home} label="My Room"
          value={roomDetails ? roomDetails.roomNumber : 'N/A'}
          sub={roomDetails ? `Block ${roomDetails.block}` : 'Not assigned'}
          accent="bg-blue-500" />
        <QuickCard to="/student/complaints" icon={MessageSquare} label="Complaints"
          value={complaintStats.total}
          sub={`${complaintStats.pending} pending`}
          accent="bg-amber-500" />
        <QuickCard to="/student/leaves" icon={Calendar} label="Leave Requests"
          value={leaveStats.total}
          sub={`${leaveStats.pending} pending`}
          accent="bg-violet-500" />
        <QuickCard to="/student/fees" icon={IndianRupee} label="Fee Status"
          value={feeDetails ? feeDetails.status : 'N/A'}
          sub={feeDetails ? formatCurrency(feeDetails.remainingDues) + ' dues' : ''}
          accent="bg-emerald-500" />
      </div>

      {/* Fee Summary */}
      {feeDetails && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <IndianRupee className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-700">Fee Summary</h3>
            <Link to="/student/fees" className="ml-auto text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Details <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Fee', value: formatCurrency(feeDetails.totalFee), color: 'text-slate-800' },
              { label: 'Amount Paid', value: formatCurrency(feeDetails.amountPaid), color: 'text-emerald-600' },
              { label: 'Remaining', value: formatCurrency(feeDetails.remainingDues), color: 'text-rose-600' },
              { label: 'Status', value: feeDetails.status, color: '' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                {label === 'Status' ? (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(value)}`}>{value}</span>
                ) : (
                  <p className={`text-base font-bold ${color}`}>{value}</p>
                )}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Payment progress</span>
              <span>{feeDetails.totalFee > 0 ? ((feeDetails.amountPaid / feeDetails.totalFee) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${feeDetails.totalFee > 0 ? Math.min((feeDetails.amountPaid / feeDetails.totalFee) * 100, 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Room Details */}
      {roomDetails && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-700">Room Information</h3>
            <Link to="/student/room" className="ml-auto text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Details <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Room Number', value: roomDetails.roomNumber },
              { label: 'Block', value: roomDetails.block },
              { label: 'Floor', value: roomDetails.floor },
              { label: 'Occupancy', value: `${roomDetails.occupants?.length} / ${roomDetails.capacity}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Complaints */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-700">Recent Complaints</h3>
            </div>
            <Link to="/student/complaints" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentComplaints.length > 0 ? recentComplaints.map(c => (
              <div key={c._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-400">{formatDate(c.createdAt)}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
              </div>
            )) : (
              <p className="text-slate-400 text-sm text-center py-6">No complaints yet</p>
            )}
          </div>
        </div>

        {/* Leaves */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-bold text-slate-700">Recent Leave Requests</h3>
            </div>
            <Link to="/student/leaves" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentLeaves.length > 0 ? recentLeaves.map(l => (
              <div key={l._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{l.numberOfDays} Days Leave</p>
                  <p className="text-xs text-slate-400">{formatDate(l.fromDate)} → {formatDate(l.toDate)}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(l.status)}`}>{l.status}</span>
              </div>
            )) : (
              <p className="text-slate-400 text-sm text-center py-6">No leave requests yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;