import { useState, useEffect } from 'react';
import { DollarSign, Calendar, CreditCard } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/constants';

const MyFees = () => {
  const [feeDetails, setFeeDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeeDetails();
  }, []);

  const fetchFeeDetails = async () => {
    try {
      const response = await axios.get('/fees/my');
      setFeeDetails(response.data.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch fee details');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  if (!feeDetails) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Fee Record</h2>
          <p className="text-gray-600">Your fee details have not been set up yet.</p>
          <p className="text-gray-600 mt-2">Please contact the hostel administrator.</p>
        </div>
      </div>
    );
  }

  const paymentPercentage = ((feeDetails.amountPaid / feeDetails.totalFee) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Fee Details</h1>
        <p className="text-gray-600 mt-2">View your fee payment information</p>
      </div>

      {/* Fee Overview */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90 mb-1">Fee Status</p>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${feeDetails.status === 'Paid' ? 'bg-green-500' : feeDetails.status === 'Partially Paid' ? 'bg-yellow-500' : 'bg-red-500'}`}>
              {feeDetails.status}
            </span>
          </div>
          <DollarSign className="h-16 w-16 opacity-50" />
        </div>
        <div className="mt-4">
          <p className="text-sm opacity-90">Payment Progress</p>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-3 mt-2">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${paymentPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2">{paymentPercentage}% Paid</p>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Fee</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(feeDetails.totalFee)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(feeDetails.amountPaid)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining Dues</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(feeDetails.remainingDues)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Information */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Fee Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Semester</p>
            <p className="font-medium">{feeDetails.semester}</p>
          </div>
          {feeDetails.dueDate && (
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="font-medium">{formatDate(feeDetails.dueDate)}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="font-medium">{formatDate(feeDetails.lastUpdated)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feeDetails.status)}`}>
              {feeDetails.status}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {feeDetails.paymentHistory && feeDetails.paymentHistory.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeDetails.paymentHistory.map((payment, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.transactionId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Important Notice */}
      {feeDetails.remainingDues > 0 && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Payment Reminder</h4>
              <p className="text-sm text-yellow-800">
                You have pending dues of {formatCurrency(feeDetails.remainingDues)}. 
                Please contact the hostel office to make a payment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFees;