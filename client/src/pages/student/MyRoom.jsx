import { useState, useEffect } from 'react';
import { Home, Users, MapPin, BedDouble, Building2, IndianRupee, Wifi } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const MyRoom = () => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRoomDetails(); }, []);

  const fetchRoomDetails = async () => {
    try {
      const u = await axios.get('/auth/me');
      if (u.data.data.roomAssigned) {
        const r = await axios.get(`/rooms/${u.data.data.roomAssigned._id}`);
        setRoom(r.data.data);
      }
    } catch { toast.error('Failed to fetch room details'); }
    finally { setLoading(false); }
  };

  if (loading) return <Loader fullScreen />;

  if (!room) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Home className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Room Assigned</h2>
        <p className="text-slate-500 text-sm">You have not been assigned a room yet.</p>
        <p className="text-slate-400 text-sm mt-1">Please contact the hostel administrator.</p>
      </div>
    </div>
  );

  const pct = Math.round((room.occupants.length / room.capacity) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Room</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your assigned room details</p>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl p-7 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">Room Number</p>
            <h2 className="text-5xl font-black text-white tracking-tight">{room.roomNumber}</h2>
            <div className="flex items-center gap-4 mt-3">
              <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
                <p className="text-white/60 text-xs">Block</p>
                <p className="text-white font-bold text-sm">{room.block}</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
                <p className="text-white/60 text-xs">Floor</p>
                <p className="text-white font-bold text-sm">Floor {room.floor}</p>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
                <p className="text-white/60 text-xs">Status</p>
                <p className="text-white font-bold text-sm">{room.status}</p>
              </div>
            </div>
          </div>
          <Home className="h-20 w-20 text-white/20 hidden md:block" />
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: MapPin, label: 'Block', value: room.block, color: 'bg-blue-500' },
          { icon: Building2, label: 'Floor', value: `Floor ${room.floor}`, color: 'bg-indigo-500' },
          { icon: BedDouble, label: 'Capacity', value: `${room.capacity} Beds`, color: 'bg-violet-500' },
          { icon: IndianRupee, label: 'Rent/Bed', value: room.rentPerBed ? `₹${room.rentPerBed}` : 'N/A', color: 'bg-emerald-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}><Icon className="h-4 w-4 text-white" /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Occupancy */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-700">Occupancy</h3>
          </div>
          <span className="text-sm font-bold text-slate-800">{room.occupants.length} / {room.capacity}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
        </div>

        {room.occupants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {room.occupants.map(o => (
              <div key={o._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                  {o.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{o.name}</p>
                  <p className="text-xs text-slate-400 truncate">{o.studentId} · {o.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">No roommates yet</p>
        )}
      </div>

      {/* Amenities */}
      {room.amenities?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-700">Room Amenities</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {room.amenities.map((a, i) => (
              <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-semibold">{a}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRoom;