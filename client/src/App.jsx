import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageRooms from './pages/admin/ManageRooms';
import ManageStudents from './pages/admin/ManageStudents';
import ManageFees from './pages/admin/ManageFees';
import ViewComplaints from './pages/admin/ViewComplaints';
import ViewLeaves from './pages/admin/ViewLeaves';

// Warden Pages
import WardenDashboard from './pages/warden/WardenDashboard';
import WardenComplaints from './pages/warden/ManageComplaints';
import WardenLeaves from './pages/warden/ManageLeaves';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyRoom from './pages/student/MyRoom';
import MyComplaints from './pages/student/MyComplaints';
import MyLeaves from './pages/student/MyLeaves';
import MyFees from './pages/student/MyFees';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              duration: 3000,
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              duration: 4000,
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="rooms" element={<ManageRooms />} />
            <Route path="complaints" element={<ViewComplaints />} />
            <Route path="leaves" element={<ViewLeaves />} />
            <Route path="fees" element={<ManageFees />} />
          </Route>

          {/* Warden Routes */}
          <Route
            path="/warden"
            element={
              <ProtectedRoute allowedRoles={['warden']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<WardenDashboard />} />
            <Route path="complaints" element={<WardenComplaints />} />
            <Route path="leaves" element={<WardenLeaves />} />
            <Route path="rooms" element={<ManageRooms />} />
          </Route>

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="room" element={<MyRoom />} />
            <Route path="complaints" element={<MyComplaints />} />
            <Route path="leaves" element={<MyLeaves />} />
            <Route path="fees" element={<MyFees />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;