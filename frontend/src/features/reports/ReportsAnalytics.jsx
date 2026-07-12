import React from 'react';
import {
  useGetUtilizationReportQuery,
  useGetRetirementForecastQuery,
  useGetDepartmentSummaryQuery
} from './reportsApiSlice.js';
import { TrendingUp, Trash2, Home } from 'lucide-react';

const ReportsAnalytics = () => {
  const { data: utilizationData, isLoading: isLoadingUtil } = useGetUtilizationReportQuery();
  const { data: retirementData, isLoading: isLoadingRetire } = useGetRetirementForecastQuery();
  const { data: deptData, isLoading: isLoadingDept } = useGetDepartmentSummaryQuery();

  const utils = utilizationData?.data || [];
  const retires = retirementData?.data || [];
  const depts = deptData?.data || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-sm text-slate-500">Review dynamic statistics and forecasting metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Utilization Ranking */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Top 10 Highly Utilized Assets</h3>
          </div>
          {isLoadingUtil ? (
            <div className="h-40 bg-slate-50 animate-pulse rounded-2xl"></div>
          ) : (
            <div className="space-y-3">
              {utils.length === 0 ? (
                <p className="text-xs text-slate-400">No utilization records found.</p>
              ) : (
                utils.map((u, i) => (
                  <div key={u.asset?._id || i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{u.asset?.name || 'Unknown'}</p>
                      <span className="text-xs text-slate-400 font-mono">{u.asset?.assetTag}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {u.utilizationCount} Allocations
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Retirement Forecast */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-base">Retirement Forecast (Assets older than 3 yrs)</h3>
          </div>
          {isLoadingRetire ? (
            <div className="h-40 bg-slate-50 animate-pulse rounded-2xl"></div>
          ) : (
            <div className="space-y-3">
              {retires.length === 0 ? (
                <p className="text-xs text-slate-400">No assets nearing expected end-of-life threshold.</p>
              ) : (
                retires.map((r, i) => (
                  <div key={r._id || i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                      <span className="text-xs text-slate-400 font-mono">{r.assetTag}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      Acquired: {new Date(r.acquisitionDate).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Department Allocation Summary */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Home className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">Department Cost Allocations</h3>
          </div>
          {isLoadingDept ? (
            <div className="h-40 bg-slate-50 animate-pulse rounded-2xl"></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {depts.length === 0 ? (
                <p className="text-xs text-slate-400 col-span-3">No cost summaries computed yet.</p>
              ) : (
                depts.map((d, i) => (
                  <div key={d.department?._id || i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{d.department?.name || 'Unassigned'}</h4>
                      <p className="text-xs text-slate-500 mt-1">Total Assets: {d.assetCount}</p>
                    </div>
                    <h3 className="text-xl font-extrabold text-emerald-600 mt-4">${d.totalValue?.toLocaleString()}</h3>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
