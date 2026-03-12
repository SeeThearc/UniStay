import { useState, useEffect } from 'react';
import { Map, Users, Wrench, CheckCircle, RefreshCw, Info } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

/* ── helpers ── */
const OCC = {
  Available: { bg: 'bg-emerald-400', hover: 'hover:bg-emerald-500', text: 'text-white', label: 'Available' },
  Full:      { bg: 'bg-rose-500',    hover: 'hover:bg-rose-600',    text: 'text-white', label: 'Full' },
  Partial:   { bg: 'bg-amber-400',   hover: 'hover:bg-amber-500',   text: 'text-white', label: 'Partial' },
  Maintenance:{ bg: 'bg-slate-400',  hover: 'hover:bg-slate-500',   text: 'text-white', label: 'Maintenance' },
};

const getRoomState = (room) => {
  if (room.status === 'Maintenance') return 'Maintenance';
  if (room.occupants.length === 0) return 'Available';
  if (room.occupants.length >= room.capacity) return 'Full';
  return 'Partial';
};

const pct = (room) => Math.round((room.occupants.length / room.capacity) * 100);

/* ── tooltip ── */
const Tooltip = ({ room, onClose }) => {
  const state = getRoomState(room);
  const s = OCC[state];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 w-72 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Room</p>
            <h3 className="text-3xl font-bold text-slate-800">{room.roomNumber}</h3>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
        </div>

        {/* info grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            ['Block', room.block],
            ['Floor', `Floor ${room.floor}`],
            ['Capacity', `${room.capacity} beds`],
            ['Occupied', `${room.occupants.length} / ${room.capacity}`],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-xl p-2.5">
              <p className="text-xs text-slate-400">{k}</p>
              <p className="text-sm font-bold text-slate-700">{v}</p>
            </div>
          ))}
        </div>

        {/* occupancy bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Occupancy</span><span>{pct(room)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct(room) >= 100 ? 'bg-rose-500' : pct(room) > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${pct(room)}%` }}
            />
          </div>
        </div>

        {/* occupants */}
        {room.occupants.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Occupants</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {room.occupants.map(o => (
                <div key={o._id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5">
                  <div className="h-6 w-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                    {o.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-700 truncate">{o.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-600 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
};

/* ── main ── */
const RoomHeatmap = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeBlock, setActiveBlock] = useState('All');

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/rooms');
      setRooms(r.data.data);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); }, []);

  if (loading) return <Loader fullScreen />;

  /* group: block → floor → rooms */
  const blocks = ['All', ...Array.from(new Set(rooms.map(r => r.block))).sort()];
  const filtered = activeBlock === 'All' ? rooms : rooms.filter(r => r.block === activeBlock);

  const byBlockFloor = filtered.reduce((acc, room) => {
    const b = room.block;
    const f = room.floor;
    if (!acc[b]) acc[b] = {};
    if (!acc[b][f]) acc[b][f] = [];
    acc[b][f].push(room);
    return acc;
  }, {});

  /* summary counts */
  const counts = {
    Available:   rooms.filter(r => getRoomState(r) === 'Available').length,
    Partial:     rooms.filter(r => getRoomState(r) === 'Partial').length,
    Full:        rooms.filter(r => getRoomState(r) === 'Full').length,
    Maintenance: rooms.filter(r => getRoomState(r) === 'Maintenance').length,
  };
  const totalBeds    = rooms.reduce((s, r) => s + r.capacity, 0);
  const occupiedBeds = rooms.reduce((s, r) => s + r.occupants.length, 0);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Map className="h-6 w-6 text-indigo-600" /> Room Heatmap
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Visual occupancy map — click any room for details</p>
        </div>
        <button onClick={fetch} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-all shadow-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Beds', value: totalBeds, icon: Users, accent: 'bg-indigo-500' },
          { label: 'Occupied', value: occupiedBeds, icon: Users, accent: 'bg-slate-500' },
          { label: 'Available', value: counts.Available, icon: CheckCircle, accent: 'bg-emerald-500' },
          { label: 'Partial', value: counts.Partial, icon: Info, accent: 'bg-amber-500' },
          { label: 'Full / Maint.', value: counts.Full + counts.Maintenance, icon: Wrench, accent: 'bg-rose-500' },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className={`inline-flex p-2 rounded-xl mb-2 ${accent}`}><Icon className="h-4 w-4 text-white" /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-2">Legend</span>
        {Object.entries(OCC).map(([state, style]) => (
          <div key={state} className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded-md ${style.bg}`} />
            <span className="text-xs font-medium text-slate-600">{style.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md border-2 border-dashed border-slate-300 bg-white" />
          <span className="text-xs font-medium text-slate-600">Empty</span>
        </div>
      </div>

      {/* block filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {blocks.map(b => (
          <button
            key={b}
            onClick={() => setActiveBlock(b)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeBlock === b
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {b === 'All' ? 'All Blocks' : `Block ${b}`}
          </button>
        ))}
      </div>

      {/* heatmap grid — per block, per floor */}
      <div className="space-y-6">
        {Object.keys(byBlockFloor).sort().map(block => (
          <div key={block} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* block header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3">
              <h2 className="text-white font-bold text-sm tracking-wide">Block {block}</h2>
            </div>

            <div className="p-5 space-y-5">
              {Object.keys(byBlockFloor[block]).sort((a, b) => Number(a) - Number(b)).map(floor => (
                <div key={floor}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    Floor {floor}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {byBlockFloor[block][floor]
                      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }))
                      .map(room => {
                        const state = getRoomState(room);
                        const s = OCC[state];
                        const occupancy = pct(room);
                        return (
                          <button
                            key={room._id}
                            onClick={() => setSelected(room)}
                            title={`Room ${room.roomNumber} — ${state} (${room.occupants.length}/${room.capacity})`}
                            className={`
                              relative group w-16 h-16 rounded-2xl flex flex-col items-center justify-center
                              font-bold text-sm transition-all duration-150 shadow-sm
                              ${s.bg} ${s.hover} ${s.text}
                              hover:scale-110 hover:shadow-md active:scale-95
                            `}
                          >
                            <span className="text-xs font-bold leading-none">{room.roomNumber}</span>
                            <span className="text-xs opacity-80 mt-0.5">{room.occupants.length}/{room.capacity}</span>

                            {/* thin occupancy bar at bottom */}
                            <div className="absolute bottom-1.5 left-2 right-2 h-1 bg-black/20 rounded-full overflow-hidden">
                              <div className="h-full bg-white/60 rounded-full" style={{ width: `${occupancy}%` }} />
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* tooltip / detail modal */}
      {selected && <Tooltip room={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default RoomHeatmap;
