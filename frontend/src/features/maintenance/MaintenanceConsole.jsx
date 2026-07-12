import React, { useState } from 'react';
import {
  useGetMaintenanceRequestsQuery,
  useCreateMaintenanceRequestMutation,
  useApproveMaintenanceMutation,
  useRejectMaintenanceMutation,
  useAssignTechnicianMutation,
  useUpdateMaintenanceProgressMutation
} from './maintenanceApiSlice.js';
import { useGetAssetsQuery } from '../assets/assetsApiSlice.js';
import { useSelector } from 'react-redux';
import { Plus, Wrench, ShieldAlert } from 'lucide-react';

const MaintenanceConsole = () => {
  const user = useSelector((state) => state.auth.user);
  const { data: maintenanceData, isLoading } = useGetMaintenanceRequestsQuery();
  const { data: assetsData } = useGetAssetsQuery();
  const [createMaintenance] = useCreateMaintenanceRequestMutation();
  const [approveMaintenance] = useApproveMaintenanceMutation();
  const [rejectMaintenance] = useRejectMaintenanceMutation();
  const [updateProgress] = useUpdateMaintenanceProgressMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetId, setAssetId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('Medium');

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMaintenance({
        assetId,
        issueDescription,
        priority,
      }).unwrap();
      setIsModalOpen(false);
      setAssetId('');
      setIssueDescription('');
      setPriority('Medium');
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to raise maintenance ticket.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveMaintenance(id).unwrap();
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to approve ticket.');
    }
  };

  const handleResolve = async (id) => {
    try {
      await updateProgress({ id, status: 'Resolved' }).unwrap();
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to resolve ticket.');
    }
  };

  const tickets = maintenanceData?.data || [];
  const assets = assetsData?.data || [];

  const isManager = ['Admin', 'AssetManager'].includes(user?.role);
  const isTechnician = user?.role === 'Technician';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance & Repair Tickets</h1>
          <p className="text-sm text-slate-500">Raise or process hardware issue repairs</p>
        </div>
        {!isTechnician && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 col-span-2 text-center">No maintenance logs found.</p>
          ) : (
            tickets.map((t) => (
              <div key={t._id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{t.asset?.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">{t.asset?.assetTag}</span>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      t.priority === 'Critical' ? 'bg-rose-50 text-rose-700' :
                      t.priority === 'High' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {t.priority} Priority
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      t.status === 'Pending' ? 'bg-slate-50 text-slate-500 border border-slate-200' :
                      t.status === 'Approved' ? 'bg-indigo-50 text-indigo-700' :
                      t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-sans">
                  {t.issueDescription}
                </p>

                <div className="flex items-center space-x-2 pt-2">
                  {t.status === 'Pending' && isManager && (
                    <>
                      <button
                        onClick={() => handleApprove(t._id)}
                        className="flex-1 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors shadow-sm"
                      >
                        Approve & Start Repair
                      </button>
                      <button
                        onClick={() => rejectMaintenance({ id: t._id, rejectionReason: 'Declined' })}
                        className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {t.status === 'Approved' && (isManager || isTechnician) && (
                    <button
                      onClick={() => handleResolve(t._id)}
                      className="w-full py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm"
                    >
                      Mark as Resolved & Set Asset Available
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Raise Repair Ticket</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              >
                <option value="">Select Asset</option>
                {assets.map(a => (
                  <option key={a._id} value={a._id}>{a.name} ({a.assetTag})</option>
                ))}
              </select>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the hardware issue details..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm h-24"
                required
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical Priority</option>
              </select>
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
                  File Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceConsole;
