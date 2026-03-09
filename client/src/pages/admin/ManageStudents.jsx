import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Home, Users, UserCheck, UserX, GraduationCap } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const r = await axios.get('/auth/students');
      setStudents(r.data.data);
    } catch { toast.error('Failed to fetch students'); }
    finally { setLoading(false); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  const withRoom = students.filter(s => s.roomAssigned).length;
  const withoutRoom = students.length - withRoom;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Students</h1>
          <p className="text-sm text-slate-500 mt-0.5">{students.length} registered students</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: students.length, icon: GraduationCap, accent: 'bg-indigo-500' },
          { label: 'With Room', value: withRoom, icon: UserCheck, accent: 'bg-emerald-500' },
          { label: 'Without Room', value: withoutRoom, icon: UserX, accent: 'bg-rose-500' },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${accent}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, email, or student ID…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Student', 'Student ID', 'Phone', 'Room', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? filtered.map(student => (
                <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-indigo-600 font-bold text-sm">{student.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="h-3 w-3" />{student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">{student.studentId}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Phone className="h-3 w-3 text-slate-400" />{student.phoneNumber || 'N/A'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {student.roomAssigned ? (
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Home className="h-3 w-3 text-slate-400" />Room {student.roomAssigned.roomNumber}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${student.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">{searchTerm ? 'No students found' : 'No students registered yet'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;