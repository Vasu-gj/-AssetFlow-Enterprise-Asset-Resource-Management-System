import React, { useState } from 'react';
import { useGetBookingsQuery, useCreateBookingMutation, useCancelBookingMutation } from './bookingsApiSlice.js';
import { useGetAssetsQuery } from '../assets/assetsApiSlice.js';
import { useSelector } from 'react-redux';
import { Plus, Calendar, Clock, Ban } from 'lucide-react';

const BookingsScheduler = () => {
  const user = useSelector((state) => state.auth.user);
  const { data: bookingsData, isLoading } = useGetBookingsQuery();
  const { data: assetsData } = useGetAssetsQuery({ isSharedBookable: true });
  const [createBooking] = useCreateBookingMutation();
  const [cancelBooking] = useCancelBookingMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createBooking({
        assetId,
        startTime,
        endTime,
        purpose,
      }).unwrap();
      setIsModalOpen(false);
      setAssetId('');
      setStartTime('');
      setEndTime('');
      setPurpose('');
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to create booking.');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(id).unwrap();
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to cancel booking.');
    }
  };

  const bookings = bookingsData?.data || [];
  const assets = assetsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resource Bookings</h1>
          <p className="text-sm text-slate-500">Schedule shared rooms, equipment, and resources</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md transition-colors text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Book Resource
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-500 py-6">No scheduler bookings recorded.</p>
          ) : (
            bookings.map((b) => (
              <div key={b._id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{b.asset?.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">{b.asset?.assetTag}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    b.status === 'Upcoming' ? 'bg-indigo-50 text-indigo-700' :
                    b.status === 'Ongoing' ? 'bg-amber-50 text-amber-700' :
                    b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-500">
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    Start: {new Date(b.startTime).toLocaleString()}
                  </p>
                  <p className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                    End: {new Date(b.endTime).toLocaleString()}
                  </p>
                  <p className="text-slate-600 italic">Purpose: "{b.purpose}"</p>
                </div>

                {b.status === 'Upcoming' && (b.bookedBy?._id === user?.id || ['Admin', 'AssetManager'].includes(user?.role)) && (
                  <button
                    onClick={() => handleCancel(b._id)}
                    className="flex items-center justify-center w-full px-3 py-2 text-xs font-semibold rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-100 transition-colors"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Book Shared Resource</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              >
                <option value="">Select Resource</option>
                {assets.map(a => (
                  <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>
                ))}
              </select>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Booking Purpose (e.g. Sprint Planning)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              />
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md transition-colors text-sm"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsScheduler;
