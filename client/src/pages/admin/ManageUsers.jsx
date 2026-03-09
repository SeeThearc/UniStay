import { useState, useEffect, useRef } from 'react';
import {
    Plus, Trash2, UserCheck, UserX, Search, Upload, Download,
    Users, GraduationCap, ShieldCheck, Eye, EyeOff, ChevronDown, X, CheckCircle2, XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

/* ─── helpers ──────────────────────────────────────── */
const ic = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent";
const lc = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";

const SAMPLE_HEADERS = ['name', 'email', 'password', 'role', 'studentId', 'phoneNumber'];

function downloadSampleExcel() {
    const ws = XLSX.utils.aoa_to_sheet([
        SAMPLE_HEADERS,
        ['Ravi Sharma', 'ravi@college.edu', 'pass123', 'student', '23BMI001', '9876543210'],
        ['Priya Singh', 'priya@college.edu', 'pass456', 'warden', '', '9123456789'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'UniStay_bulk_users_template.xlsx');
}

/* ─── sub-components ───────────────────────────────── */
function UserTable({ users, onToggle, onDelete, emptyLabel }) {
    if (!users.length) return (
        <div className="py-16 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">{emptyLabel}</p>
        </div>
    );
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        {['Name', 'Email', 'ID / Phone', 'Room', 'Status', 'Actions'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                                        {u.name[0].toUpperCase()}
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                            <td className="px-4 py-3">
                                {u.studentId && <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg mr-1">{u.studentId}</span>}
                                {u.phoneNumber && <span className="text-xs text-slate-400">{u.phoneNumber}</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                                {u.roomAssigned ? `Room ${u.roomAssigned.roomNumber}` : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                    {u.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onToggle(u)} className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={u.isActive ? 'Deactivate' : 'Activate'}>
                                        {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                    </button>
                                    <button onClick={() => onDelete(u)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors" title="Delete">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ─── main component ──────────────────────────────── */
const ManageUsers = () => {
    const [tab, setTab] = useState('student');
    const [students, setStudents] = useState([]);
    const [wardens, setWardens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // modals
    const [showAdd, setShowAdd] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
    const [showPw, setShowPw] = useState(false);

    // bulk
    const [bulkRows, setBulkRows] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const fileRef = useRef();

    // add form
    const blank = { name: '', email: '', password: '', role: 'student', studentId: '', phoneNumber: '' };
    const [form, setForm] = useState(blank);

    const fetchAll = async () => {
        try {
            const [sRes, wRes] = await Promise.allSettled([
                axios.get('/auth/students'),
                axios.get('/auth/wardens'),
            ]);
            if (sRes.status === 'fulfilled') setStudents(sRes.value.data.data);
            else toast.error('Failed to load students');
            if (wRes.status === 'fulfilled') setWardens(wRes.value.data.data);
            else toast.error('Failed to load wardens — restart the server');
        } catch {
            toast.error('Failed to load users');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    /* add one ───────────── */
    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/auth/admin/users', form);
            toast.success(`${form.role === 'student' ? 'Student' : 'Warden'} created`);
            setShowAdd(false); setForm(blank); fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    /* toggle status ──────── */
    const handleToggle = async (u) => {
        try {
            await axios.put(`/auth/admin/users/${u._id}/toggle`);
            toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}`);
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    /* delete ─────────────── */
    const handleDelete = async (u) => {
        if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
        try {
            await axios.delete(`/auth/admin/users/${u._id}`);
            toast.success('User deleted');
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    /* bulk excel ─────────── */
    const handleExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const wb = XLSX.read(ev.target.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
            // normalize keys to lowercase
            const rows = data.map(r => {
                const out = {};
                Object.keys(r).forEach(k => { out[k.toLowerCase().trim()] = String(r[k]).trim(); });
                return out;
            });
            setBulkRows(rows);
            setBulkResult(null);
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkSubmit = async () => {
        if (!bulkRows.length) return;
        setBulkLoading(true);
        try {
            const res = await axios.post('/auth/admin/users/bulk', { users: bulkRows });
            setBulkResult(res.data.data);
            toast.success(res.data.message);
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Bulk upload failed'); }
        finally { setBulkLoading(false); }
    };

    /* filtered lists ──────── */
    const q = search.toLowerCase();
    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.studentId || '').toLowerCase().includes(q)
    );
    const filteredWardens = wardens.filter(w =>
        w.name.toLowerCase().includes(q) || w.email.toLowerCase().includes(q)
    );

    if (loading) return <Loader fullScreen />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Users</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage student and warden accounts</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setShowBulk(true); setBulkRows([]); setBulkResult(null); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all">
                        <Upload className="h-4 w-4" /> Bulk Upload
                    </button>
                    <button onClick={() => { setShowAdd(true); setForm({ ...blank, role: tab }); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm">
                        <Plus className="h-4 w-4" /> Add User
                    </button>
                </div>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="inline-flex p-2.5 rounded-xl mb-3 bg-indigo-500"><GraduationCap className="h-4 w-4 text-white" /></div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Students</p>
                    <p className="text-2xl font-bold text-slate-800 mt-0.5">{students.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="inline-flex p-2.5 rounded-xl mb-3 bg-teal-500"><ShieldCheck className="h-4 w-4 text-white" /></div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Wardens</p>
                    <p className="text-2xl font-bold text-slate-800 mt-0.5">{wardens.length}</p>
                </div>
            </div>

            {/* Tab + Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
                    <div className="flex gap-1">
                        {[{ id: 'student', label: 'Students', count: students.length }, { id: 'warden', label: 'Wardens', count: wardens.length }].map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                {t.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-lg ${tab === t.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent w-52" />
                    </div>
                </div>

                <UserTable
                    users={tab === 'student' ? filteredStudents : filteredWardens}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    emptyLabel={`No ${tab}s found`}
                />
            </div>

            {/* ── Add User Modal ── */}
            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New User">
                <form onSubmit={handleAdd} className="space-y-4">
                    {/* Role */}
                    <div>
                        <label className={lc}>Role</label>
                        <div className="flex gap-3">
                            {['student', 'warden'].map(r => (
                                <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${form.role === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={lc}>Full Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={ic} placeholder="e.g. Arjun Sharma" /></div>
                        <div><label className={lc}>Phone</label><input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className={ic} placeholder="10-digit number" /></div>
                    </div>

                    <div><label className={lc}>Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={ic} placeholder="user@college.edu" /></div>

                    {form.role === 'student' && (
                        <div><label className={lc}>Student ID</label><input value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className={ic} placeholder="e.g. 23BMI001" /></div>
                    )}

                    <div>
                        <label className={lc}>Password</label>
                        <div className="relative">
                            <input required type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={`${ic} pr-10`} placeholder="Set a password" />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-95">Create User</button>
                        <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm">Cancel</button>
                    </div>
                </form>
            </Modal>

            {/* ── Bulk Upload Modal ── */}
            <Modal isOpen={showBulk} onClose={() => setShowBulk(false)} title="Bulk Upload Users" size="lg">
                <div className="space-y-5">
                    {/* Download template */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-indigo-800">Download Sample Template</p>
                            <p className="text-xs text-indigo-500 mt-0.5">Fill the Excel file and upload it below</p>
                        </div>
                        <button onClick={downloadSampleExcel} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                            <Download className="h-3.5 w-3.5" /> Template
                        </button>
                    </div>

                    {/* File picker */}
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Upload Excel File (.xlsx)</p>
                        <div
                            onClick={() => fileRef.current.click()}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                        >
                            <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">{bulkRows.length ? `${bulkRows.length} rows loaded — click to re-upload` : 'Click to select file, or drag & drop'}</p>
                            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleExcel} className="hidden" />
                        </div>
                    </div>

                    {/* Preview */}
                    {bulkRows.length > 0 && !bulkResult && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Preview ({bulkRows.length} rows)</p>
                            <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-52 overflow-y-auto">
                                <table className="min-w-full text-xs">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>{SAMPLE_HEADERS.map(h => <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold uppercase">{h}</th>)}</tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {bulkRows.map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                {SAMPLE_HEADERS.map(h => <td key={h} className="px-3 py-2 text-slate-700">{r[h] || <span className="text-slate-300">—</span>}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {bulkResult && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                    <div><p className="text-xs text-emerald-600">Created</p><p className="text-lg font-bold text-emerald-700">{bulkResult.created.length}</p></div>
                                </div>
                                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                                    <div><p className="text-xs text-rose-600">Failed</p><p className="text-lg font-bold text-rose-700">{bulkResult.failed.length}</p></div>
                                </div>
                            </div>
                            {bulkResult.failed.length > 0 && (
                                <div className="bg-rose-50 rounded-xl p-3 space-y-1 max-h-32 overflow-y-auto">
                                    {bulkResult.failed.map((f, i) => (
                                        <p key={i} className="text-xs text-rose-700"><span className="font-mono font-semibold">{f.email}</span>: {f.reason}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {bulkRows.length > 0 && !bulkResult && (
                        <button onClick={handleBulkSubmit} disabled={bulkLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-95">
                            {bulkLoading ? 'Uploading…' : `Upload ${bulkRows.length} Users`}
                        </button>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ManageUsers;
