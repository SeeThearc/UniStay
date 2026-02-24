export const ROLES = {
  ADMIN: 'admin',
  WARDEN: 'warden',
  STUDENT: 'student',
};

export const COMPLAINT_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

export const COMPLAINT_CATEGORIES = [
  'Maintenance',
  'Electrical',
  'Plumbing',
  'Cleaning',
  'Security',
  'Other',
];

export const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const LEAVE_TYPES = [
  'Medical',
  'Emergency',
  'Personal',
  'Other',
];

export const ROOM_STATUS = {
  AVAILABLE: 'Available',
  FULL: 'Full',
  MAINTENANCE: 'Maintenance',
};

export const FEE_STATUS = {
  PAID: 'Paid',
  PARTIALLY_PAID: 'Partially Paid',
  UNPAID: 'Unpaid',
};

export const getStatusColor = (status) => {
  const colors = {
    Pending: 'text-yellow-600 bg-yellow-100',
    'In Progress': 'text-blue-600 bg-blue-100',
    Resolved: 'text-green-600 bg-green-100',
    Approved: 'text-green-600 bg-green-100',
    Rejected: 'text-red-600 bg-red-100',
    Available: 'text-green-600 bg-green-100',
    Full: 'text-red-600 bg-red-100',
    Maintenance: 'text-orange-600 bg-orange-100',
    Paid: 'text-green-600 bg-green-100',
    'Partially Paid': 'text-yellow-600 bg-yellow-100',
    Unpaid: 'text-red-600 bg-red-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};