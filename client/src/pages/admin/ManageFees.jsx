import { useState, useEffect } from 'react';
import { Search, DollarSign, Plus, TrendingUp } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatCurrency, getStatusColor } from '../../utils/constants';

const ManageFees = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [feeStats, setFeeStats] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    totalFee: '',
    semester: 'Current',
    dueDate: '',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    transactionId: '',
    remarks: '',
  });

  useEffect(() => {
    fetchFees();
    fetchStudents();
    fetchFeeStats();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await axios.get('/fees');
      setFees(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch fees');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/auth/students');
      setStudents(response.data.data);
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const fetchFeeStats = async () => {
    try {
      const response = await axios.get('/fees/stats');
      setFeeStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch fee stats');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/fees', formData);
      toast.success('Fee record created/updated successfully');
      fetchFees();
      fetchFeeStats();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/fees/${selectedFee._id}/payment`, paymentData);
      toast.success('Payment recorded successfully');
      fetchFees();
      fetchFeeStats();
      closePaymentModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      studentId: '',
      totalFee: '',
      semester: 'Current',
      dueDate: '',
    });
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedFee(null);
    setPaymentData({
      amount: '',
      paymentMethod: 'Cash',
      transactionId: '',
      remarks: '',
    });
  };

  const filteredFees = fees.filter(fee =>
    fee.studentId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.studentId?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Fees</h1>
          <p className="text-gray-600 mt-2">Track and manage student fee payments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Set Fee
        </button>
      </div>

      {/* Stats */}
      {feeStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Fee Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(feeStats.totalFeeAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="stat-card border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(feeStats.totalCollected)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="stat-card border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Dues</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(feeStats.totalPending)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="stat-card border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {((feeStats.totalCollected / feeStats.totalFeeAmount) * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Fees Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining Dues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFees.map((fee) => (
                <tr key={fee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fee.studentId?.name}</div>
                    <div className="text-sm text-gray-500">{fee.studentId?.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(fee.totalFee)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600 font-medium">
                      {formatCurrency(fee.amountPaid)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-red-600 font-medium">
                      {formatCurrency(fee.remainingDues)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        setSelectedFee(fee);
                        setShowPaymentModal(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 font-medium"
                    >
                      Add Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Fee Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Set Student Fee">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
              className="input-field"
            >
              <option value="">Choose a student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.studentId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Fee Amount
            </label>
            <input
              type="number"
              value={formData.totalFee}
              onChange={(e) => setFormData({ ...formData, totalFee: e.target.value })}
              required
              min="0"
              className="input-field"
              placeholder="Enter total fee"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semester
            </label>
            <input
              type="text"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              className="input-field"
              placeholder="e.g., Fall 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 btn-primary">
              Set Fee
            </button>
            <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={closePaymentModal} title="Record Payment">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">Student: <span className="font-medium text-gray-900">{selectedFee?.studentId?.name}</span></p>
            <p className="text-sm text-gray-600">Remaining Dues: <span className="font-medium text-red-600">{formatCurrency(selectedFee?.remainingDues || 0)}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              required
              min="0"
              max={selectedFee?.remainingDues}
              className="input-field"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              className="input-field"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Online Transfer">Online Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID (Optional)
            </label>
            <input
              type="text"
              value={paymentData.transactionId}
              onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
              className="input-field"
              placeholder="Enter transaction ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={paymentData.remarks}
              onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Any additional notes"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 btn-primary">
              Record Payment
            </button>
            <button type="button" onClick={closePaymentModal} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageFees;