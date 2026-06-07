import { useState } from "react";
import { AdminLogin } from "./pages/AdminLogin";
import { LandingPage } from "./pages/LandingPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { WorkersManagement } from "./pages/WorkersManagement";
import { ViolationsPage } from "./pages/ViolationsPage";
import { WorkerDashboard } from "./pages/WorkerDashboard";
import { BestWorkerPage } from "./pages/BestWorkerPage";
import { AttendancePage } from "./pages/AttendancePage";
import { ReportsPage } from "./pages/ReportsPage";
import { GovtSchemesPage } from "./pages/GovtSchemesPage";
import { LabourDataPage } from "./pages/LabourDataPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ViolationHotspotsPage } from "./pages/ViolationHotspotsPage";
import { Header } from "./components/Header";
import { Button } from "./components/ui/button";
import { Home, LogOut } from "lucide-react";

type Role = "admin" | "worker" | null;
type Page = "login" | "landing" | "dashboard" | "workers" | "violations" | "attendance" | "reports" | "best-worker" | "govt-schemes" | "labour-data" | "payments" | "hotspots" | "my-violations" | "my-attendance" | "notifications" | "profile";

function App() {
  const [role, setRole] = useState<Role>(null);
  const [currentPage, setCurrentPage] = useState<Page>("login");

  const handleLogin = (userRole: "admin" | "worker") => {
    setRole(userRole);
    setCurrentPage("landing");
  };

  const handleNavigate = (page: string) => {
    if (page === "login") {
      setRole(null);
      setCurrentPage("login");
    } else {
      setCurrentPage(page as Page);
    }
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentPage("login");
  };

  const handleBackToHome = () => {
    setCurrentPage("landing");
  };

  // Login Screen
  if (role === null || currentPage === "login") {
    return <AdminLogin onLogin={handleLogin} />;
  }

  // Admin Pages
  const renderAdminPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={handleNavigate} />;
      case "dashboard":
        return <AdminDashboard />;
      case "workers":
        return <WorkersManagement />;
      case "best-worker":
        return <BestWorkerPage />;
      case "violations":
        return <ViolationsPage />;
      case "attendance":
        return <AttendancePage />;
      case "reports":
        return <ReportsPage />;
      case "govt-schemes":
        return <GovtSchemesPage />;
      case "labour-data":
        return <LabourDataPage />;
      case "payments":
        return <PaymentsPage />;
      case "hotspots":
        return <ViolationHotspotsPage />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  // Worker Pages
  const renderWorkerPage = () => {
    switch (currentPage) {
      case "landing":
        return <WorkerDashboard />;
      case "dashboard":
        return <WorkerDashboard />;
      case "my-violations":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Violations</h1>
              <p className="text-gray-500">View all your violations and fines</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Detailed violations list coming soon...</p>
            </div>
          </div>
        );
      case "my-attendance":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Attendance</h1>
              <p className="text-gray-500">Track your attendance record</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Attendance records coming soon...</p>
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-500">View all your notifications and alerts</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Notifications coming soon...</p>
            </div>
          </div>
        );
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-500">Manage your profile information</p>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Profile settings coming soon...</p>
            </div>
          </div>
        );
      default:
        return <WorkerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <Header
        role={role}
        userName={role === "admin" ? "Varun Chaudhary" : "Rajesh Kumar"}
      />

      {/* Main Content */}
      <div className="pt-16 min-h-screen bg-[#F8FAFC]">
        {currentPage !== "landing" && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center gap-3 max-w-[1600px] mx-auto">
              <Button
                variant="outline"
                onClick={handleBackToHome}
                className="hover:bg-[#06B6D4]/10 hover:border-[#06B6D4] hover:text-[#06B6D4]"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="hover:bg-[#DC2626]/10 hover:border-[#DC2626] hover:text-[#DC2626]"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}

        <div className={currentPage === "landing" ? "" : ""}>
          {role === "admin" ? renderAdminPage() : renderWorkerPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
