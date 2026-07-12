import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../layouts/Layout.jsx';
import RequireAuth from '../components/RequireAuth.jsx';

import Dashboard from '../features/dashboard/Dashboard.jsx';
import Login from '../features/auth/Login.jsx';
import Signup from '../features/auth/Signup.jsx';
import AssetsList from '../features/assets/AssetsList.jsx';
import CategoriesList from '../features/categories/CategoriesList.jsx';
import DepartmentsList from '../features/departments/DepartmentsList.jsx';
import BookingsScheduler from '../features/bookings/BookingsScheduler.jsx';
import MaintenanceConsole from '../features/maintenance/MaintenanceConsole.jsx';
import AuditCampaigns from '../features/audits/AuditCampaigns.jsx';
import ReportsAnalytics from '../features/reports/ReportsAnalytics.jsx';
import Unauthorized from '../components/Unauthorized.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<AssetsList />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Scoped Role Routes */}
          <Route element={<RequireAuth allowedRoles={['Admin', 'AssetManager']} />}>
            <Route path="/categories" element={<CategoriesList />} />
          </Route>
          
          <Route element={<RequireAuth allowedRoles={['Admin', 'AssetManager', 'DepartmentHead']} />}>
            <Route path="/departments" element={<DepartmentsList />} />
          </Route>

          <Route path="/bookings" element={<BookingsScheduler />} />
          
          <Route element={<RequireAuth allowedRoles={['Admin', 'AssetManager', 'Technician', 'Employee']} />}>
            <Route path="/maintenance" element={<MaintenanceConsole />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['Admin', 'AssetManager', 'Employee']} />}>
            <Route path="/audits" element={<AuditCampaigns />} />
          </Route>

          <Route element={<RequireAuth allowedRoles={['Admin', 'AssetManager', 'DepartmentHead']} />}>
            <Route path="/reports" element={<ReportsAnalytics />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<div className="flex items-center justify-center min-h-[70vh] text-slate-500 font-semibold">404 - Page Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
