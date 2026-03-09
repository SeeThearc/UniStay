import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin, Edit3, Check, X,
    ShieldCheck, Calendar, BadgeInfo, KeyRound, Eye, EyeOff
} from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ic = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent";
const lc = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1";

function InfoRow({ icon: Icon, label, value, accent = 'bg-teal-50 text-teal-600' }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
            <div className={`p-2 rounded-lg shrink-0 ${accent}`}><Icon className="h-4 w-4" /></div>
            <div className="min-w-0">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{value || <span className="text-slate-300 font-normal">Not set</span>}</p>
            </div>
        </div>
    );
}

const WardenInfo = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({});
    // change password
    const [showPwSection, setShowPwSection] = useState(false);
    const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwSaving, setPwSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/auth/me');
            setProfile(res.data.data);
            setForm({
                name: res.data.data.name || '',
                phoneNumber: res.data.data.phoneNumber || '',
                address: res.data.data.address || '',
            });
        } catch { toast.error('Failed to load profile'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put('/auth/profile', form);
            toast.success('Profile updated');
            setEditing(false);
            await fetchProfile();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (pwForm.newPassword.length < 4) {
            toast.error('Password must be at least 4 characters');
            return;
        }
        setPwSaving(true);
        try {
            await axios.put('/auth/profile', { password: pwForm.newPassword });
            toast.success('Password changed successfully');
            setPwForm({ newPassword: '', confirmPassword: '' });
            setShowPwSection(false);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
        finally { setPwSaving(false); }
    };

    if (loading) return <Loader fullScreen />;

    const initials = (profile?.name || 'W').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Info</h1>
                <p className="text-sm text-slate-500 mt-0.5">Your profile and account details</p>
            </div>

            {/* Profile banner — teal for warden */}
            <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-600 rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
                <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-black shrink-0">
                    {initials}
                </div>
                <div className="relative">
                    <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
                    <p className="text-white/70 text-sm mt-0.5">{profile?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-white/10 border border-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">Warden</span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${profile?.isActive ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30' : 'bg-rose-400/20 text-rose-100 border border-rose-300/30'}`}>
                            {profile?.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                <button onClick={() => setEditing(!editing)} className="ml-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                    <Edit3 className="h-3.5 w-3.5" /> {editing ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>

            {/* Edit form */}
            {editing && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Edit3 className="h-4 w-4 text-teal-500" />
                        <h3 className="text-sm font-bold text-slate-700">Edit Profile</h3>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={lc}>Full Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={ic} /></div>
                            <div><label className={lc}>Phone Number</label><input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className={ic} /></div>
                        </div>
                        <div><label className={lc}>Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={ic} placeholder="Home address" /></div>
                        <div className="flex gap-3 pt-1">
                            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-60">
                                <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => setEditing(false)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl">
                                <X className="h-4 w-4" /> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Info grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <BadgeInfo className="h-3.5 w-3.5 text-teal-400" /> Account Details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoRow icon={User} label="Full Name" value={profile?.name} />
                    <InfoRow icon={Mail} label="Email Address" value={profile?.email} accent="bg-slate-100 text-slate-600" />
                    <InfoRow icon={Phone} label="Phone Number" value={profile?.phoneNumber} />
                    <InfoRow icon={MapPin} label="Address" value={profile?.address} accent="bg-amber-50 text-amber-600" />
                </div>
            </div>

            {/* Account meta */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Account
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <InfoRow icon={ShieldCheck} label="Role" value="Warden" />
                    <InfoRow icon={Calendar} label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null} accent="bg-slate-100 text-slate-600" />
                </div>
            </div>
            {/* Change Password */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                        <KeyRound className="h-3.5 w-3.5 text-teal-400" /> Security
                    </p>
                    <button
                        onClick={() => { setShowPwSection(!showPwSection); setPwForm({ newPassword: '', confirmPassword: '' }); }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${showPwSection ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                            }`}>
                        {showPwSection ? 'Cancel' : 'Change Password'}
                    </button>
                </div>

                {!showPwSection && (
                    <p className="text-sm text-slate-400 mt-3">Your password is managed by the admin. You can change it here anytime.</p>
                )}

                {showPwSection && (
                    <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                        <div>
                            <label className={lc}>New Password</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={pwForm.newPassword}
                                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                    required minLength={4} placeholder="Enter new password"
                                    className={`${ic} pr-10`}
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={lc}>Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={pwForm.confirmPassword}
                                    onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                    required minLength={4} placeholder="Repeat new password"
                                    className={`${ic} pr-10 ${pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                                            ? 'border-rose-300 focus:ring-rose-400' : ''
                                        }`}
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                                <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
                            )}
                        </div>
                        <button type="submit" disabled={pwSaving || pwForm.newPassword !== pwForm.confirmPassword}
                            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-semibold rounded-xl transition-all active:scale-95">
                            <KeyRound className="h-4 w-4" /> {pwSaving ? 'Changing…' : 'Change Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default WardenInfo;
