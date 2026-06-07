import { Users, AlertTriangle, DollarSign, UserX } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { ViolationCard } from "../components/ViolationCard";
import { Card } from "../components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const violationData = [
  { name: "Helmet Safety Violation", value: 45 },
  { name: "Cleanliness Compliance Violation", value: 30 },
  { name: "Unattended Tap Detection", value: 25 },
];

const dailyFineData = [
  { day: "Mon", amount: 12000 },
  { day: "Tue", amount: 15000 },
  { day: "Wed", amount: 18000 },
  { day: "Thu", amount: 14000 },
  { day: "Fri", amount: 20000 },
  { day: "Sat", amount: 16000 },
  { day: "Sun", amount: 10000 },
];

const violationByTypeData = [
  { type: "Helmet", count: 45 },
  { type: "Garbage", count: 30 },
  { type: "Tap", count: 25 },
  { type: "Other", count: 15 },
];

const COLORS = ["#DC2626", "#D97706", "#0891B2", "#64748B"];

const liveViolations = [
  {
    id: 1,
    workerName: "Rajesh Kumar",
    violationType: "Helmet Safety Violation",
    fineAmount: 500,
    timestamp: "2 mins ago",
    imageUrl: "https://images.unsplash.com/photo-1694522362256-6c907336af43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXIlMjBoZWxtZXQlMjBzYWZldHl8ZW58MXx8fHwxNzcyNzAwNDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    status: "Pending" as const,
  },
  {
    id: 2,
    workerName: "Mohammed Ali",
    violationType: "Garbage Thrown Outside",
    fineAmount: 300,
    timestamp: "5 mins ago",
    imageUrl: "https://images.unsplash.com/photo-1582489851864-4b4bddaf6a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwc2FmZXR5JTIwd29ya2VyfGVufDF8fHx8MTc3MjY2MTg1NXww&ixlib=rb-4.1.0&q=80&w=1080",
    status: "Pending" as const,
  },
  {
    id: 3,
    workerName: "Suresh Patel",
    violationType: "Unattended Tap Detection",
    fineAmount: 200,
    timestamp: "12 mins ago",
    imageUrl: "https://images.unsplash.com/photo-1666137270524-5131ac07314d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwdmlvbGF0aW9ufGVufDF8fHx8MTc3MjcwMDQ0N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    status: "Approved" as const,
  },
];

export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor labour camp compliance, violations, and analytics in real-time</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Workers"
            value="1,247"
            icon={Users}
            trend={12}
            iconBgColor="bg-[#06B6D4]/10"
            iconColor="text-[#06B6D4]"
          />
          <StatCard
            title="Violations Today"
            value="23"
            icon={AlertTriangle}
            trend={-8}
            iconBgColor="bg-[#DC2626]/10"
            iconColor="text-[#DC2626]"
          />
          <StatCard
            title="Total Fine Collected"
            value="₹18,500"
            icon={DollarSign}
            trend={15}
            iconBgColor="bg-[#059669]/10"
            iconColor="text-[#059669]"
          />
          <StatCard
            title="High Risk Workers"
            value="34"
            icon={UserX}
            trend={0}
            iconBgColor="bg-[#D97706]/10"
            iconColor="text-[#D97706]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Violations Feed */}
          <div className="lg:col-span-2">
            <Card className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">Live Violations</h3>
                  <p className="text-sm text-gray-600">Real-time violation detection feed</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#059669] rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>

              <div className="space-y-4">
                {liveViolations.map((violation) => (
                  <ViolationCard
                    key={violation.id}
                    {...violation}
                    onApprove={() => console.log("Approved", violation.id)}
                    onReject={() => console.log("Rejected", violation.id)}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Violation Distribution */}
          <div>
            <Card className="bg-white border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Violation Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={violationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {violationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-3">
                {violationData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-semibold text-[#0F172A]">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Violations by Type */}
          <Card className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Violations by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={violationByTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="type" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="count" fill="#06B6D4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Daily Fine Collection */}
          <Card className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Daily Fine Collection</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyFineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ fill: "#06B6D4", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}