import React, { useState } from 'react';
import { useGetDepartmentsQuery, useCreateDepartmentMutation } from './departmentsApiSlice.js';
import { Plus } from 'lucide-react';

const DepartmentsList = () => {
  const { data: departmentsData, isLoading } = useGetDepartmentsQuery();
  const [createDepartment] = useCreateDepartmentMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentDepartment, setParentDepartment] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createDepartment({
        name,
        code,
        parentDepartment: parentDepartment || null,
      }).unwrap();
      setIsModalOpen(false);
      setName('');
      setCode('');
      setParentDepartment('');
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to create department.');
    }
  };

  const departments = departmentsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-sm text-slate-500">Manage company organizational structures and units</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md transition-colors text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </button>
      </div>

      {isLoading ? (
        <div className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.length === 0 ? (
            <p className="text-sm text-slate-500 py-6">No departments configured.</p>
          ) : (
            departments.map((d) => (
              <div key={d._id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{d.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-mono">{d.code}</span>
                </div>
                {d.parentDepartment && (
                  <p className="text-xs text-slate-400">
                    Parent: <span className="font-medium text-slate-500">{typeof d.parentDepartment === 'object' ? d.parentDepartment.name : d.parentDepartment}</span>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Department</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Department Name (e.g. Engineering)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Department Code (e.g. ENG)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono uppercase"
                required
              />
              <select
                value={parentDepartment}
                onChange={(e) => setParentDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">No Parent Department</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsList;
