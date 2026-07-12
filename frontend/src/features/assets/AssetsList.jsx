import React, { useState } from 'react';
import { useGetAssetsQuery, useCreateAssetMutation } from './assetsApiSlice.js';
import { useGetCategoriesQuery } from '../categories/categoriesApiSlice.js';
import { useGetDepartmentsQuery } from '../departments/departmentsApiSlice.js';
import { useSelector } from 'react-redux';
import { Plus, Search, Filter } from 'lucide-react';

const AssetsList = () => {
  const user = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: assetsData, isLoading } = useGetAssetsQuery({ search, status: statusFilter });
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: departmentsData } = useGetDepartmentsQuery();
  const [createAsset] = useCreateAssetMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [location, setLocation] = useState('');

  const canManage = ['Admin', 'AssetManager'].includes(user?.role);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAsset({
        name,
        serialNumber,
        category,
        department: department || null,
        acquisitionCost: Number(acquisitionCost),
        location,
        acquisitionDate: new Date().toISOString(),
      }).unwrap();
      setIsModalOpen(false);
      setName('');
      setSerialNumber('');
      setCategory('');
      setDepartment('');
      setAcquisitionCost('');
      setLocation('');
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to register asset.');
    }
  };

  const assets = assetsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500">Track and manage organization physical assets</p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Register Asset
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by tag, serial, or name..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="UnderMaintenance">Under Maintenance</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Assets Table */}
      {isLoading ? (
        <div className="h-60 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Asset Tag</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Serial Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">No assets matching the filters.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{asset.assetTag}</td>
                    <td className="px-6 py-4">{asset.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{asset.serialNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        asset.status === 'Available' ? 'bg-emerald-50 text-emerald-700' :
                        asset.status === 'Allocated' ? 'bg-indigo-50 text-indigo-700' :
                        asset.status === 'UnderMaintenance' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{asset.location || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Register New Asset</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Asset Name (e.g. MacBook Pro)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              />
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Serial Number"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono"
                required
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              >
                <option value="">Select Category</option>
                {categoriesData?.data?.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">No Department Assignment</option>
                {departmentsData?.data?.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
                placeholder="Acquisition Cost"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Room 402, SF Office)"
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
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsList;
