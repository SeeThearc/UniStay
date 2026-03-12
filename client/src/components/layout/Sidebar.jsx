import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, DoorOpen, MessageSquare,
  Calendar, IndianRupee, Home, Shield, GraduationCap,
  HardHat, LogOut, BadgeInfo, Map
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roleConfig = {
  admin: {
    label: 'Admin Portal',
    accent: 'from-indigo-600 to-violet-600',
    icon: Shield,
    color: 'indigo',
  },
  warden: {
    label: 'Warden Portal',
    accent: 'from-teal-600 to-cyan-600',
    icon: HardHat,
    color: 'teal',
  },
  student: {
    label: 'Student Portal',
    accent: 'from-blue-600 to-indigo-600',
    icon: GraduationCap,
    color: 'blue',
  },
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const rc = roleConfig[user?.role] || roleConfig.student;
  const RoleIcon = rc.icon;

  const getMenuItems = () => {
    if (user?.role === 'admin') return [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/users', icon: Users, label: 'Users' },
      { path: '/admin/rooms', icon: DoorOpen, label: 'Rooms' },
      { path: '/admin/heatmap', icon: Map, label: 'Heatmap' },
      { path: '/admin/complaints', icon: MessageSquare, label: 'Complaints' },
      { path: '/admin/leaves', icon: Calendar, label: 'Leaves' },
      { path: '/admin/fees', icon: IndianRupee, label: 'Fees' },
    ];
    if (user?.role === 'warden') return [
      { path: '/warden', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/warden/complaints', icon: MessageSquare, label: 'Complaints' },
      { path: '/warden/leaves', icon: Calendar, label: 'Leaves' },
      { path: '/warden/rooms', icon: DoorOpen, label: 'Rooms' },
      { path: '/warden/heatmap', icon: Map, label: 'Heatmap' },
      { path: '/warden/info', icon: BadgeInfo, label: 'Info' },
    ];
    if (user?.role === 'student') return [
      { path: '/student', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/student/room', icon: Home, label: 'My Room' },
      { path: '/student/complaints', icon: MessageSquare, label: 'Complaints' },
      { path: '/student/leaves', icon: Calendar, label: 'Leaves' },
      { path: '/student/fees', icon: IndianRupee, label: 'Fees' },
      { path: '/student/info', icon: BadgeInfo, label: 'Info' },
    ];
    return [];
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col shadow-sm">
      {/* Brand / Role Header */}
      <div className={`bg-gradient-to-br ${rc.accent} px-5 py-6`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <RoleIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">{rc.label}</p>
            <p className="text-white/70 text-xs mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 bg-white/10 rounded-xl px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-white/60 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Menu</p>
        <ul className="space-y-0.5">
          {getMenuItems().map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={['/admin', '/warden', '/student'].includes(item.path)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-100' : 'bg-transparent'}`}>
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                    </div>
                    {item.label}
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all"
        >
          <div className="p-1.5 rounded-lg bg-transparent">
            <LogOut className="h-4 w-4" />
          </div>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;