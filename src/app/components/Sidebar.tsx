import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  LogOut,
  Bell,
  User,
  Award
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "worker";
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ role, currentPage, onNavigate }: SidebarProps) {
  const adminMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "workers", label: "Workers", icon: Users },
    { id: "best-worker", label: "Best Worker", icon: Award },
    { id: "violations", label: "Violations", icon: AlertTriangle },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  const workerMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "my-violations", label: "My Violations", icon: AlertTriangle },
    { id: "my-attendance", label: "My Attendance", icon: Calendar },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  const menuItems = role === "admin" ? adminMenuItems : workerMenuItems;

  return (
    <div className="w-64 bg-[#0F172A] h-screen fixed left-0 top-0 flex flex-col shadow-xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-lg flex items-center justify-center shadow-lg">
            <div className="w-5 h-5 bg-white rounded"></div>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">SmartCamp AI</h1>
            <p className="text-cyan-300 text-xs">Monitoring System</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#06B6D4]/20 to-transparent border-l-4 border-[#06B6D4] text-white shadow-lg"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-white/10">
        <button
          onClick={() => onNavigate("login")}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/5 hover:text-white transition-all rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}