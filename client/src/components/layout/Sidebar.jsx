import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  MessageSquare,
  Calendar,
  DollarSign,
  FileText,
  Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const getMenuItems = () => {
    if (user?.role === 'admin') {
      return [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/students', icon: Users, label: 'Students' },
        { path: '/admin/rooms', icon: DoorOpen, label: 'Rooms' },
        { path: '/admin/complaints', icon: MessageSquare, label: 'Complaints' },
        { path: '/admin/leaves', icon: Calendar, label: 'Leaves' },
        { path: '/admin/fees', icon: DollarSign, label: 'Fees' },
      ];
    }

    if (user?.role === 'warden') {
      return [
        { path: '/warden', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/warden/complaints', icon: MessageSquare, label: 'Complaints' },
        { path: '/warden/leaves', icon: Calendar, label: 'Leaves' },
        { path: '/warden/rooms', icon: DoorOpen, label: 'Rooms' },
      ];
    }

    if (user?.role === 'student') {
      return [
        { path: '/student', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/student/room', icon: Home, label: 'My Room' },
        { path: '/student/complaints', icon: MessageSquare, label: 'Complaints' },
        { path: '/student/leaves', icon: Calendar, label: 'Leaves' },
        { path: '/student/fees', icon: DollarSign, label: 'Fees' },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold capitalize">{user?.role} Portal</h2>
        <p className="text-gray-400 text-sm mt-1">{user?.name}</p>
      </div>

      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/admin' || item.path === '/warden' || item.path === '/student'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;