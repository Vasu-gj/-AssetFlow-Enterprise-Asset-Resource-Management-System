import React from 'react';
import { useSelector } from 'react-redux';
import { useGetDashboardKPIsQuery } from '../reports/reportsApiSlice.js';
import { Link } from 'react-router-dom';
import {
  Box,
  CalendarCheck,
  Wrench,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const { data: kpisData, isLoading, error } = useGetDashboardKPIsQuery();

  const kpis = kpisData?.data || {
    assetsAvailable: 0,
    assetsAllocated: 0,
    maintenanceTickets: 0,
    activeBookings: 0,
    pendingTransfers: 0,
    upcomingReturns: 0,
  };

  const statCards = [
    { label: 'Available Assets', value: kpis.assetsAvailable, icon: Box, color: 'bg-indigo-500/10 text-indigo-600' },
    { label: 'Allocated Assets', value: kpis.assetsAllocated, icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Active Bookings', value: kpis.activeBookings, icon: CalendarCheck, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Maintenance Requests', value: kpis.maintenanceTickets, icon: Wrench, color: 'bg-rose-500/10 text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}!</h1>
          <p className="text-sm text-slate-500">Here is what is happening with your organization's resources today.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full border border-violet-100 uppercase tracking-wider">
          Role: {user?.role}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
          Failed to load dashboard metrics. Ensure database connection is active.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{card.label}</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{card.value}</h3>
                </div>
                <div className={`p-4 rounded-2xl ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/assets"
            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-violet-300 hover:bg-violet-50/20 group transition-all duration-200"
          >
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Browse Asset Inventory</h4>
              <p className="text-xs text-slate-500 mt-0.5">Check tags and statuses</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-violet-600 transition-all" />
          </Link>

          <Link
            to="/bookings"
            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-violet-300 hover:bg-violet-50/20 group transition-all duration-200"
          >
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Book Resources</h4>
              <p className="text-xs text-slate-500 mt-0.5">Schedule meeting rooms/labs</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-violet-600 transition-all" />
          </Link>

          <Link
            to="/maintenance"
            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-violet-300 hover:bg-violet-50/20 group transition-all duration-200"
          >
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Maintenance Central</h4>
              <p className="text-xs text-slate-500 mt-0.5">Report damage or repair tickets</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 group-hover:text-violet-600 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
