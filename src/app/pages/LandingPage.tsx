import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Calendar,
  FileText,
  Trophy,
  Gift,
  Database,
  CreditCard,
  MapPin,
  ArrowRight
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const modules = [
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Overview of violations, analytics, and real-time monitoring",
      icon: LayoutDashboard,
    },
    {
      id: "workers",
      title: "Workers Management",
      description: "Manage worker profiles, behavior scores, and performance",
      icon: Users,
    },
    {
      id: "violations",
      title: "Violations Management",
      description: "Track and manage safety violations and fines",
      icon: AlertTriangle,
    },
    {
      id: "attendance",
      title: "Attendance Management",
      description: "Monitor worker attendance and work hours",
      icon: Calendar,
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      description: "Generate comprehensive reports and insights",
      icon: FileText,
    },
    {
      id: "best-worker",
      title: "Top Performers",
      description: "View top performers and award recognition",
      icon: Trophy,
    },
    {
      id: "govt-schemes",
      title: "Government Labour Schemes",
      description: "Access and share government welfare schemes for workers",
      icon: Gift,
    },
    {
      id: "labour-data",
      title: "Labour Data Management",
      description: "Centralized database of all worker information",
      icon: Database,
    },
    {
      id: "payments",
      title: "Payment Management",
      description: "Process and manage worker payments and transactions",
      icon: CreditCard,
    },
    {
      id: "hotspots",
      title: "Violation Hotspots",
      description: "Track and visualize violation-prone areas on site",
      icon: MapPin,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Admin Control Center</h1>
          <p className="text-gray-600">Monitor workforce activity, compliance, and analytics in real time.</p>
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="group bg-white hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-gray-300 overflow-hidden"
                onClick={() => onNavigate(module.id)}
              >
                <div className="p-6">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-[#06B6D4]/10 rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#06B6D4]" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
                    {module.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {module.description}
                  </p>

                  {/* Action Button */}
                  <Button
                    className="w-full bg-[#06B6D4] text-white hover:bg-[#0891B2] transition-colors rounded-lg group"
                  >
                    View
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
