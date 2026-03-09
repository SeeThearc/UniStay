import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserPlus, UserMinus, Search, DoorOpen, Users, Layers, ArrowUpRight } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { getStatusColor } from '../../utils/constants';

const ic = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent";
const lc = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";

const statusAccent = {
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Full: 'bg-rose-50 text-rose-700 border-rose-100',
  Maintenance: 'bg-amber-50 text-amber-700 border-amber-100',
};

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ roomNumber: '', block: '', floor: '', capacity: '', status: 'Available', rentPerBed: '' });

  useEffect(() => { fetchRooms(); fetchStudents(); }, []);

  const fetchRooms = async () => {
    try { const r = await axios.get('/rooms'); setRooms(r.data.data); }
    catch { toast.error('Failed to fetch rooms'); }
    finally { setLoading(false); }
  };
  const fetchStudents = async () => {
    try { const r = await axios.get('/auth/students'); setStudents(r.data.data.filter(s => !s.roomAssigned)); }
    catch { console.error('Failed to fetch students'); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRoom) { await axios.put(`/rooms/${selectedRoom._id}`, formData); toast.success('Room updated'); }
      else { await axios.post('/rooms', formData); toast.success('Room created'); }
      fetchRooms(); closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try { await axios.delete(`/rooms/${id}`); toast.success('Room deleted'); fetchRooms(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };
  const handleAssignStudent = async (studentId) => {
    try { await axios.post(`/rooms/${selectedRoom._id}/assign`, { studentId }); toast.success('Student assigned'); fetchRooms(); fetchStudents(); setShowAssignModal(false); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to assign'); }
  };
  const handleUnassignStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the room?')) return;
    try { await axios.post(`/rooms/${selectedRoom._id}/unassign`, { studentId }); toast.success('Student removed'); fetchRooms(); fetchStudents(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
  };
  const openModal = (room = null) => {
    if (room) { setSelectedRoom(room); setFormData({ roomNumber: room.roomNumber, block: room.block, floor: room.floor, capacity: room.capacity, status: room.status, rentPerBed: room.rentPerBed }); }
    else { setSelectedRoom(null); setFormData({ roomNumber: '', block: '', floor: '', capacity: '', status: 'Available', rentPerBed: '' }); }
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setSelectedRoom(null); };
  const filtered = rooms.filter(r => r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) || r.block.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <Loader fullScreen />;

  const stats = [
    { label: 'Total Rooms', value: rooms.length, icon: DoorOpen, accent: 'bg-indigo-500' },
    { label: 'Available', value: rooms.filter(r => r.status === 'Available').length, icon: ArrowUpRight, accent: 'bg-emerald-500' },
    { label: 'Full', value: rooms.filter(r => r.status === 'Full').length, icon: Users, accent: 'bg-rose-500' },
    { label: 'Maintenance', value: rooms.filter(r => r.status === 'Maintenance').length, icon: Layers, accent: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rooms</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage hostel rooms and assignments</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm">
          <Plus className="h-4 w-4" /> Add Room
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${accent}`}><Icon className="h-4 w-4 text-white" /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input type="text" placeholder="Search by room number or block…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent" />
        </div>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(room => {
          const pct = Math.round((room.occupants.length / room.capacity) * 100);
          return (
            <div key={room._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Room</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{room.roomNumber}</h3>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusAccent[room.status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>{room.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[['Block', room.block], ['Floor', `Floor ${room.floor}`], ['Capacity', `${room.capacity} beds`], ['Rent/Bed', room.rentPerBed ? `₹${room.rentPerBed}` : 'N/A']].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="text-sm font-semibold text-slate-700">{v}</p>
                  </div>
                ))}
              </div>

              {/* Occupancy bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Occupancy</span><span>{room.occupants.length}/{room.capacity}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Occupants */}
              {room.occupants.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Occupants</p>
                  {room.occupants.map(o => (
                    <div key={o._id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">{o.name[0].toUpperCase()}</div>
                        <span className="text-sm text-slate-700">{o.name}</span>
                      </div>
                      <button onClick={() => { setSelectedRoom(room); handleUnassignStudent(o._id); }} className="p-1 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors">
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-50">
                {room.status !== 'Full' && (
                  <button onClick={() => { setSelectedRoom(room); setShowAssignModal(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                    <UserPlus className="h-3.5 w-3.5" /> Assign
                  </button>
                )}
                <button onClick={() => openModal(room)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors">
                  <Edit className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(room._id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={selectedRoom ? 'Edit Room' : 'Add New Room'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={lc}>Room Number</label>
            <input type="text" value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} required className={ic} placeholder="e.g. 1322" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Block</label><input type="text" value={formData.block} onChange={e => setFormData({ ...formData, block: e.target.value })} required className={ic} placeholder="e.g. A" /></div>
            <div><label className={lc}>Floor</label><input type="number" value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} required className={ic} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lc}>Capacity (beds)</label><input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} required min="1" max="10" className={ic} /></div>
            <div><label className={lc}>Rent Per Bed (₹)</label><input type="number" value={formData.rentPerBed} onChange={e => setFormData({ ...formData, rentPerBed: e.target.value })} className={ic} /></div>
          </div>
          <div>
            <label className={lc}>Status</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={ic}>
              <option>Available</option><option>Full</option><option>Maintenance</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-95">{selectedRoom ? 'Update Room' : 'Create Room'}</button>
            <button type="button" onClick={closeModal} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Assign Student Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign Student — Room ${selectedRoom?.roomNumber}`}>
        <div className="space-y-2">
          {students.length > 0 ? students.map(s => (
            <div key={s._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">{s.name[0].toUpperCase()}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.studentId} · {s.email}</p>
                </div>
              </div>
              <button onClick={() => handleAssignStudent(s._id)} className="text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Assign</button>
            </div>
          )) : (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No unassigned students available</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManageRooms;