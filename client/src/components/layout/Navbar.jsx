import { Bell, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const roleColors = {
    admin: 'bg-indigo-100 text-indigo-700',
    warden: 'bg-teal-100 text-teal-700',
    student: 'bg-blue-100 text-blue-700',
  };
  const badgeColor = roleColors[user?.role] || 'bg-slate-100 text-slate-600';

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo / App name */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-none">UniStay</h1>
            <p className="text-xs text-slate-400 leading-none mt-0.5">Smart Hostel Management</p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User info */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
                <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded capitalize mt-0.5 ${badgeColor}`}>
                  {user?.role}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
                  </div>
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">Profile</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;