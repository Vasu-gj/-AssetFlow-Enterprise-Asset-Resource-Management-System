import React, { useState } from 'react';
import {
  useGetAuditCyclesQuery,
  useCreateAuditCycleMutation,
  useMarkAuditEntryMutation,
  useCloseAuditCycleMutation
} from './auditsApiSlice.js';
import { useGetDepartmentsQuery } from '../departments/departmentsApiSlice.js';
import { useSelector } from 'react-redux';
import { Plus, ShieldAlert, Award } from 'lucide-react';

const AuditCampaigns = () => {
  const user = useSelector((state) => state.auth.user);
  const { data: cyclesData, isLoading } = useGetAuditCyclesQuery();
  const { data: departmentsData } = useGetDepartmentsQuery();
  const [createAuditCycle] = useCreateAuditCycleMutation();
  const [markAuditEntry] = useMarkAuditEntryMutation();
  const [closeAuditCycle] = useCloseAuditCycleMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [scopeDepartment, setScopeDepartment] = useState('');
  const [scopeLocation, setScopeLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [auditorId, setAuditorId] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAuditCycle({
        name,
        scopeDepartment: scopeDepartment || null,
        scopeLocation: scopeLocation || null,
        startDate,
        endDate,
        auditors: [auditorId || user.id],
      }).unwrap();
      setIsModalOpen(false);
      setName('');
      setScopeDepartment('');
      setScopeLocation('');
      setStartDate('');
      setEndDate('');
      setAuditorId('');
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to initialize audit campaign.');
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm('Are you sure you want to close this audit cycle? Asset statuses (Lost/Damaged) will be auto-calculated.')) return;
    try {
      await closeAuditCycle(id).unwrap();
      alert('Audit cycle closed and asset modifications completed.');
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to close audit cycle.');
    }
  };

  const cycles = cyclesData?.data || [];
  const depts = departmentsData?.data || [];

  const isManager = ['Admin', 'AssetManager'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Audits</h1>
          <p className="text-sm text-slate-500">Plan and execute verification campaigns for assets</p>
        </div>
        {isManager && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </button>
        )}
      </div>

      {/* Campaign Grid */}
      {isLoading ? (
        <div className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cycles.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 col-span-2 text-center">No audit cycles configured.</p>
          ) : (
            cycles.map((c) => (
              <div key={c._id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                    <p className="text-xs text-slate-400">Total in-scope: {c.inScopeAssets?.length || 0} assets</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    c.status === 'Open' ? 'bg-slate-50 text-slate-500 border border-slate-200' :
                    c.status === 'InProgress' ? 'bg-amber-50 text-amber-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>Start: {new Date(c.startDate).toLocaleDateString()}</p>
                  <p>End: {new Date(c.endDate).toLocaleDateString()}</p>
                </div>

                {isManager && c.status !== 'Closed' && (
                  <button
                    onClick={() => handleClose(c._id)}
                    className="w-full py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm"
                  >
                    Close Campaign & Process Actions
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
            <h3 className="text-lg font-bold text-slate-900">Initialize Audit Campaign</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Campaign Name (e.g. Q3 HW Audit)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              />
              <select
                value={scopeDepartment}
                onChange={(e) => setScopeDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">Scope: All Departments</option>
                {depts.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={scopeLocation}
                onChange={(e) => setScopeLocation(e.target.value)}
                placeholder="Scope Location Filter (e.g. San Francisco)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>
              <input
                type="text"
                value={auditorId}
                onChange={(e) => setAuditorId(e.target.value)}
                placeholder="Auditor User ID (leave blank for self)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
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
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditCampaigns;
