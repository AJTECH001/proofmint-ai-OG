import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useAccount } from "wagmi";
import Home from "./pages/Home";
import DashboardRouter from "./components/dashboard/DashboardRouter";
import { NotificationProvider } from "./components/ui/NotificationSystem";
import { ZeroGAIProvider } from "./contexts/ZeroGAIContext";
import { ZeroGDAProvider } from "./contexts/ZeroGDAContext";

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
  const { address } = useAccount();

  return (
    <ErrorBoundary>
      <ZeroGDAProvider autoInitialize={false}>
        <ZeroGAIProvider>
          <NotificationProvider>
            <Router>
              <div className="min-h-screen bg-gray-100 flex flex-col">
                <Routes>
                  <Route path="/" element={<Home account={address || ""} role={""} />} />
                 

                  {/* Dashboard with integrated admin functionality */}
                  <Route path="/dashboard" element={<DashboardRouter />} />
                  
                  {/* Redirect all other admin routes to dashboard */}
                  <Route path="/marketplace" element={<DashboardRouter />} />
                  <Route path="/recycling" element={<DashboardRouter />} />
                  <Route path="/rewards" element={<DashboardRouter />} />
                  <Route path="/users" element={<DashboardRouter />} />
                  <Route path="/analytics" element={<DashboardRouter />} />
                </Routes>
              </div>
            </Router>
          </NotificationProvider>
        </ZeroGAIProvider>
      </ZeroGDAProvider>
    </ErrorBoundary>
  );
};

export default App;