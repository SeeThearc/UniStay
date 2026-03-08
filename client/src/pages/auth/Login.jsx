import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Building2, Shield, GraduationCap, HardHat, Eye, EyeOff } from 'lucide-react';
import Loader from '../../components/common/Loader';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'warden') navigate('/warden');
      else navigate('/student');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    { role: 'Admin', icon: Shield, color: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
    { role: 'Warden', icon: HardHat, color: 'bg-teal-50 border-teal-100 text-teal-600' },
    { role: 'Student', icon: GraduationCap, color: 'bg-blue-50 border-blue-100 text-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute bottom-10 -right-16 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative text-center">
          <div className="h-20 w-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">UniStay</h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Smart Hostel Management System for modern college residences
          </p>

          <div className="mt-10 flex gap-4 justify-center">
            {roleCards.map(({ role, icon: Icon, color }) => (
              <div key={role} className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
                <Icon className="h-5 w-5 text-white/80 mx-auto mb-1" />
                <p className="text-white/80 text-xs font-medium">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">UniStay</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Welcome back 👋</h2>
            <p className="text-slate-500 mt-1">Sign in to your hostel account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email" name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@college.edu"
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-slate-400 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-slate-400 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader size="sm" /> : (
                <>
                  <LogIn className="h-4 w-4" /> Sign In
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;