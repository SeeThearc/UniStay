import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Building2, Eye, EyeOff } from 'lucide-react';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'student', studentId: '', phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const user = await register(registerData);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'warden') navigate('/warden');
      else navigate('/student');
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-slate-400 shadow-sm";
  const labelCls = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Your Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join the UniStay hostel management platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" name="name" value={formData.name}
                  onChange={handleChange} required placeholder="Your name"
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input type="tel" name="phoneNumber" value={formData.phoneNumber}
                  onChange={handleChange} placeholder="10-digit number"
                  className={inputCls} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" name="email" value={formData.email}
                onChange={handleChange} required placeholder="you@college.edu"
                className={inputCls} />
            </div>

            {/* Role */}
            <div>
              <label className={labelCls}>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}
                className={inputCls}>
                <option value="student">Student</option>
                <option value="warden">Warden</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Student ID (conditional) */}
            {formData.role === 'student' && (
              <div>
                <label className={labelCls}>Student ID</label>
                <input type="text" name="studentId" value={formData.studentId}
                  onChange={handleChange} required placeholder="e.g. 23BCE1234"
                  className={inputCls} />
              </div>
            )}

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    required minLength={6} placeholder="Min 6 chars"
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input type="password" name="confirmPassword"
                  value={formData.confirmPassword} onChange={handleChange}
                  required placeholder="Repeat password"
                  className={inputCls} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2">
              {loading ? <Loader size="sm" /> : (
                <><UserPlus className="h-4 w-4" /> Create Account</>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;