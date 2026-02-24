import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserPlus, UserMinus, Search } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { getStatusColor } from '../../utils/constants';

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    roomNumber: '',
    block: '',
    floor: '',
    capacity: '',
    status: 'Available',
    rentPerBed: '',
  });

  useEffect(() => {
    fetchRooms();
    fetchStudents();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/rooms');
      setRooms(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/auth/students');
      setStudents(response.data.data.filter(s => !s.roomAssigned));
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRoom) {
        await axios.put(`/rooms/${selectedRoom._id}`, formData);
        toast.success('Room updated successfully');
      } else {
        await axios.post('/rooms', formData);
        toast.success('Room created successfully');
      }
      fetchRooms();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await axios.delete(`/rooms/${id}`);
        toast.success('Room deleted successfully');
        fetchRooms();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete room');
      }
    }
  };

  const handleAssignStudent = async (studentId) => {
    try {
      await axios.post(`/rooms/${selectedRoom._id}/assign`, { studentId });
      toast.success('Student assigned successfully');
      fetchRooms();
      fetchStudents();
      setShowAssignModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign student');
    }
  };

  const handleUnassignStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to remove this student from the room?')) {
      try {
        await axios.post(`/rooms/${selectedRoom._id}/unassign`, { studentId });
        toast.success('Student removed successfully');
        fetchRooms();
        fetchStudents();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to remove student');
      }
    }
  };

  const openModal = (room = null) => {
    if (room) {
      setSelectedRoom(room);
      setFormData({
        roomNumber: room.roomNumber,
        block: room.block,
        floor: room.floor,
        capacity: room.capacity,
        status: room.status,
        rentPerBed: room.rentPerBed,
      });
    } else {
      setSelectedRoom(null);
      setFormData({
        roomNumber: '',
        block: '',
        floor: '',
        capacity: '',
        status: 'Available',
        rentPerBed: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  const filteredRooms = rooms.filter(room =>
    room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.block.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Rooms</h1>
          <p className="text-gray-600 mt-2">Add, edit, and manage hostel rooms</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Add Room
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by room number or block..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <div key={room._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Room {room.roomNumber}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {room.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Block:</span> {room.block}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Floor:</span> {room.floor}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Capacity:</span> {room.capacity} beds
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Occupied:</span> {room.occupants.length} / {room.capacity}
              </p>
            </div>

            {/* Occupants */}
            {room.occupants.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Occupants:</p>
                <div className="space-y-1">
                  {room.occupants.map((occupant) => (
                    <div key={occupant._id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{occupant.name}</span>
                      <button
                        onClick={() => {
                          setSelectedRoom(room);
                          handleUnassignStudent(occupant._id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              {room.status !== 'Full' && (
                <button
                  onClick={() => {
                    setSelectedRoom(room);
                    setShowAssignModal(true);
                  }}
                  className="flex-1 btn-success text-sm flex items-center justify-center"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign
                </button>
              )}
              <button
                onClick={() => openModal(room)}
                className="flex-1 btn-secondary text-sm flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(room._id)}
                className="flex-1 btn-danger text-sm flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Room Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={selectedRoom ? 'Edit Room' : 'Add New Room'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Number
            </label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block
              </label>
              <input
                type="text"
                value={formData.block}
                onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor
              </label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                min="1"
                max="10"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rent Per Bed
              </label>
              <input
                type="number"
                value={formData.rentPerBed}
                onChange={(e) => setFormData({ ...formData, rentPerBed: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input-field"
            >
              <option value="Available">Available</option>
              <option value="Full">Full</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="flex-1 btn-primary">
              {selectedRoom ? 'Update Room' : 'Create Room'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Student Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Student to Room"
      >
        <div className="space-y-4">
          {students.length > 0 ? (
            students.map((student) => (
              <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.studentId} - {student.email}</p>
                </div>
                <button
                  onClick={() => handleAssignStudent(student._id)}
                  className="btn-primary text-sm"
                >
                  Assign
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No unassigned students available</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManageRooms;