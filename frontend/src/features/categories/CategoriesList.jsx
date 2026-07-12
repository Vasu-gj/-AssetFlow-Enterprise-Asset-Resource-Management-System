import React, { useState } from 'react';
import { useGetCategoriesQuery, useCreateCategoryMutation } from './categoriesApiSlice.js';
import { Plus } from 'lucide-react';

const CategoriesList = () => {
  const { data: categoriesData, isLoading } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createCategory({ name, description }).unwrap();
      setIsModalOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      alert(err?.data?.error?.message || 'Failed to create category.');
    }
  };

  const categories = categoriesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Categories</h1>
          <p className="text-sm text-slate-500">Group assets by custom definitions and lifecycle rules</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md transition-colors text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500 py-6">No categories defined yet.</p>
          ) : (
            categories.map((c) => (
              <div key={c._id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
                <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{c.description || 'No description provided.'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Asset Category</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category Name (e.g. IT Equipment)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm"
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm h-24"
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

export default CategoriesList;
