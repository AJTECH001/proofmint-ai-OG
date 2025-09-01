import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useAccount } from "wagmi";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Recycling from "./pages/Recycling";
import Rewards from "./pages/Rewards";
import Users from "./pages/Users";
import Analytics from "./pages/Analytics";
import Layout from "./components/dashboard/Layout";
import { Role } from "./utils/types";
import { checkRole } from "./utils/contract";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-6 text-red-500">{this.state.error?.message || "An error occurred"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [role, setRole] = useState<Role>("");

  useEffect(() => {
    const fetchRole = async () => {
      if (isConnected && address) {
        try {
          const userRole = await checkRole(address);
          setRole(userRole);
        } catch (err) {
          console.error("Error fetching role:", err);
          setRole("");
        }
      }
    };
    fetchRole();
  }, [isConnected, address]);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Routes>
            <Route path="/" element={<Home account={address || ""} role={role} />} />
           

            <Route element={<Layout account={address || ""} />}>
              <Route path="/dashboard" element={<Dashboard account={address || ""} role={role} />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/recycling" element={<Recycling />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/users" element={<Users />} />
              <Route path="/analytics" element={<Analytics />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;