// src/pages/Dashboard.tsx
import React from "react";
import AdminDashboard from "../components/dashboard/AdminDashboard";

interface DashboardProps {
  account: string;
  role: string;
}

const Dashboard: React.FC<DashboardProps> = ({ account, role }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminDashboard account={account} />
    </div>
  );
};

export default Dashboard;