import { useState, useEffect } from 'react';
import { Home, Users, MapPin } from 'lucide-react';
import axios from '../../api/axios';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const MyRoom = () => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomDetails();
  }, []);

  const fetchRoomDetails = async () => {
    try {
      const userResponse = await axios.get('/auth/me');
      const user = userResponse.data.data;

      if (user.roomAssigned) {
        const roomResponse = await axios.get(`/rooms/${user.roomAssigned._id}`);
        setRoom(roomResponse.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch room details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Room Assigned</h2>
          <p className="text-gray-600">You have not been assigned a room yet.</p>
          <p className="text-gray-600 mt-2">Please contact the hostel administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Room</h1>
        <p className="text-gray-600 mt-2">Your hostel room details</p>
      </div>

      {/* Room Overview Card */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Room Number</p>
            <h2 className="text-4xl font-bold">{room.roomNumber}</h2>
          </div>
          <Home className="h-16 w-16 opacity-50" />
        </div>
      </div>

      {/* Room Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Block</p>
              <p className="text-xl font-bold text-gray-900">{room.block}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Home className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Floor</p>
              <p className="text-xl font-bold text-gray-900">{room.floor}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="text-xl font-bold text-gray-900">{room.capacity} Beds</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Occupancy</p>
              <p className="text-xl font-bold text-gray-900">
                {room.occupants.length} / {room.capacity}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roommates */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Roommates</h3>
        {room.occupants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {room.occupants.map((occupant) => (
              <div key={occupant._id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
                    {occupant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{occupant.name}</p>
                  <p className="text-sm text-gray-600">{occupant.studentId}</p>
                  <p className="text-sm text-gray-500">{occupant.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No roommates yet</p>
        )}
      </div>

      {/* Amenities */}
      {room.amenities && room.amenities.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Room Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {room.amenities.map((amenity, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRoom;