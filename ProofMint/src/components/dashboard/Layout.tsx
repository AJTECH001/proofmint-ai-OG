import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Users,
  Recycle,
  Award,
  ShoppingCart,
  LayoutDashboard,
  ChevronDown,
  Bell,
  Search,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface LayoutProps {
  account?: string;
}

const Layout: React.FC<LayoutProps> = ({ account }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Last 30 Days");
  const location = useLocation();
  
  // Get current page from path
  const currentPage = location.pathname.split("/")[1] || "dashboard";

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, count: null },
    { name: "Marketplace", path: "/marketplace", icon: <ShoppingCart className="w-5 h-5" />, count: null },
    { name: "Recycling", path: "/recycling", icon: <Recycle className="w-5 h-5" />, count: 12 },
    { name: "Rewards", path: "/rewards", icon: <Award className="w-5 h-5" />, count: null },
    { name: "Users", path: "/users", icon: <Users className="w-5 h-5" />, count: 3 },
    { name: "Analytics", path: "/analytics", icon: <BarChart3 className="w-5 h-5" />, count: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ProofMint</h1>
                <p className="text-xs text-slate-500">NFT Recycling Platform</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.count && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-200/60">
            <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-100/70 cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {account ? account.slice(0, 2) : "A"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  {account ? "Connected" : "Guest"}
                </p>
                <p className="text-xs text-slate-500">
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                </h1>
                <p className="text-sm text-slate-600">
                  NFT-Based Electronics Ownership & Recycling
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2 bg-slate-100/70 rounded-xl px-4 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm placeholder-slate-400 w-40"
                />
              </div>

              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white/80 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
              >
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 90 Days</option>
              </select>

              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-slate-100/70 transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Settings */}
              <button className="p-2 rounded-xl hover:bg-slate-100/70 transition-colors">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 space-y-8">
          <Outlet /> {/* Render child routes (e.g., AdminDashboard, BuyerDashboard) */}
        </main>
      </div>
    </div>
  );
};

export default Layout;