import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logOut } from '../features/auth/authSlice.js';
import { useGetNotificationsQuery, useMarkAsReadMutation } from '../features/notifications/notificationsApiSlice.js';
import {
  LayoutDashboard,
  Box,
  FolderTree,
  Network,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { data: notificationsData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 15000,
    skip: !currentUser,
  });
  const [markAsRead] = useMarkAsReadMutation();

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    dispatch(logOut());
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'AssetManager', 'DepartmentHead', 'Technician', 'Employee'] },
    { to: '/assets', label: 'Inventory', icon: Box, roles: ['Admin', 'AssetManager', 'DepartmentHead', 'Technician', 'Employee'] },
    { to: '/categories', label: 'Categories', icon: FolderTree, roles: ['Admin', 'AssetManager'] },
    { to: '/departments', label: 'Departments', icon: Network, roles: ['Admin', 'AssetManager', 'DepartmentHead'] },
    { to: '/bookings', label: 'Bookings', icon: CalendarDays, roles: ['Admin', 'AssetManager', 'DepartmentHead', 'Technician', 'Employee'] },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['Admin', 'AssetManager', 'Technician', 'Employee'] },
    { to: '/audits', label: 'Audit Runs', icon: ClipboardCheck, roles: ['Admin', 'AssetManager', 'Employee'] },
    { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'AssetManager', 'DepartmentHead'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentUser?.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-20 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white transform transition-transform duration-300 md:translate-x-0 md:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-0 hidden md:flex'}`}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">
            AssetFlow
          </span>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-600/25 border border-violet-500/30 text-violet-400 font-semibold">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-slate-200">{currentUser?.name}</p>
                <p className="text-xs truncate text-slate-400 capitalize">{currentUser?.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shrink-0">
          <button className="md:hidden text-slate-600 hover:text-slate-900" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4 ml-auto relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl relative transition-all duration-200"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-rose-500 rounded-full border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Container */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-2">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                        {unreadCount} Unread
                      </span>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => !n.isRead && markAsRead(n._id)}
                          className={`px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors ${!n.isRead ? 'bg-violet-50/20' : ''}`}
                        >
                          <p className={`text-xs text-slate-700 ${!n.isRead ? 'font-semibold' : ''}`}>{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 rounded-xl">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">{currentUser?.name}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
