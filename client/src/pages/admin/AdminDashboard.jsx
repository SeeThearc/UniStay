import { useState, useEffect } from 'react';
import {
  Users, DoorOpen, MessageSquare, IndianRupee,
  TrendingUp, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import { formatCurrency, getStatusColor } from '../../utils/constants';

const StatCard = ({ title, value, icon: Icon, accent, sub }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${accent}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <ArrowUpRight className="h-4 w-4 text-slate-300" />
    </div>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const r = await axios.get('/dashboard/admin');
      setDashboardData(r.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <Loader fullScreen />;

  const { overview, feeStats, complaintsByStatus, roomsByStatus, recentComplaints, recentLeaves } = dashboardData;

  const roomChartData = roomsByStatus.map(i => ({ name: i._id, value: i.count }));
  const complaintChartData = complaintsByStatus.map(i => ({ name: i._id, count: i.count }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's what's happening in the hostel today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={overview.totalStudents} icon={Users} accent="bg-indigo-500" sub="registered students" />
        <StatCard title="Total Rooms" value={overview.totalRooms} icon={DoorOpen} accent="bg-emerald-500" sub={`${overview.occupiedRooms} occupied`} />
        <StatCard title="Pending Complaints" value={overview.pendingComplaints} icon={MessageSquare} accent="bg-amber-500" sub="awaiting action" />
        <StatCard title="Fee Collected" value={formatCurrency(feeStats.totalCollected)} icon={IndianRupee} accent="bg-violet-500" sub={`of ${formatCurrency(feeStats.totalFeeAmount)}`} />
      </div>

      {/* Room Occupancy Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
        <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-20 h-20 w-20 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium mb-1">Room Occupancy Rate</p>
          <p className="text-4xl font-bold text-white">{overview.roomOccupancyPercentage}%</p>
          <p className="text-white/60 text-sm mt-1">{overview.occupiedRooms} of {overview.totalRooms} rooms occupied</p>
        </div>
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-8 border-white/20 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-white/50 mx-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Fee Overview row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Fee Assigned', value: formatCurrency(feeStats.totalFeeAmount), color: 'text-slate-800' },
          { label: 'Amount Collected', value: formatCurrency(feeStats.totalCollected), color: 'text-emerald-600' },
          { label: 'Pending Dues', value: formatCurrency(feeStats.totalPending), color: 'text-rose-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Room Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={roomChartData} cx="50%" cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90} dataKey="value">
                {roomChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Complaints by Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={complaintChartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Complaints */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Recent Complaints</h3>
          <div className="space-y-2">
            {recentComplaints.length > 0 ? recentComplaints.map(c => (
              <div key={c._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.studentId?.name}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(c.status)}`}>{c.status}</span>
              </div>
            )) : (
              <p className="text-slate-400 text-sm text-center py-6">No recent complaints</p>
            )}
          </div>
        </div>

        {/* Leaves */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Recent Leave Requests</h3>
          <div className="space-y-2">
            {recentLeaves.length > 0 ? recentLeaves.map(l => (
              <div key={l._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{l.studentId?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{l.numberOfDays} days</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(l.status)}`}>{l.status}</span>
              </div>
            )) : (
              <p className="text-slate-400 text-sm text-center py-6">No recent leaves</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;