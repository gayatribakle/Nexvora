import { Calendar, AlertTriangle, DollarSign, TrendingDown, CheckCircle2, ArrowDown, ArrowUp } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Button } from "../components/ui/button";

const behaviourTrendData = [
  { month: "Oct", score: 88 },
  { month: "Nov", score: 85 },
  { month: "Dec", score: 82 },
  { month: "Jan", score: 78 },
  { month: "Feb", score: 72 },
  { month: "Mar", score: 72 },
];

const scoreBreakdown = [
  { category: "Safety Violations", deduction: -15, color: "bg-[#EF4444]" },
  { category: "Cleanliness Violations", deduction: -8, color: "bg-[#F59E0B]" },
  { category: "Resource Wastage", deduction: -5, color: "bg-blue-500" },
];

const myViolations = [
  {
    id: "V001",
    date: "Mar 5, 2026",
    violationType: "Helmet Safety Violation",
    fine: 500,
    status: "Pending",
    proofImage: "https://images.unsplash.com/photo-1694522362256-6c907336af43?w=100",
  },
  {
    id: "V002",
    date: "Mar 3, 2026",
    violationType: "Garbage Thrown Outside",
    fine: 300,
    status: "Approved",
    proofImage: "https://images.unsplash.com/photo-1582489851864-4b4bddaf6a1b?w=100",
  },
  {
    id: "V003",
    date: "Feb 28, 2026",
    violationType: "Unattended Tap Detection",
    fine: 200,
    status: "Approved",
    proofImage: "https://images.unsplash.com/photo-1666137270524-5131ac07314d?w=100",
  },
  {
    id: "V004",
    date: "Feb 25, 2026",
    violationType: "Helmet Safety Violation",
    fine: 500,
    status: "Approved",
    proofImage: "https://images.unsplash.com/photo-1694522362256-6c907336af43?w=100",
  },
];

export function WorkerDashboard() {
  const currentScore = 72;

  const getStatusBadge = (status: string) => {
    if (status === "Approved") {
      return <Badge className="bg-[#059669] text-white">Paid</Badge>;
    }
    return <Badge className="bg-[#D97706] text-white">Pending</Badge>;
  };

  const getViolationTypeBadge = (type: string) => {
    if (type.includes("Helmet")) {
      return <Badge className="bg-[#DC2626] text-white">{type}</Badge>;
    }
    if (type.includes("Garbage")) {
      return <Badge className="bg-[#D97706] text-white">{type}</Badge>;
    }
    return <Badge className="bg-[#06B6D4] text-white">{type}</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-[#0F172A] mb-2">Workforce Performance Overview</h1>
          <p className="text-gray-600">Track attendance, compliance metrics, behaviour analysis, and workforce insights.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Attendance Status */}
          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance Status</p>
                <p className="text-2xl font-semibold text-[#0F172A]">Present</p>
              </div>
              <div className="w-10 h-10 bg-[#059669]/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-[#059669]">On time</span>
            </div>
          </Card>

          {/* Total Violations */}
          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Violations</p>
                <p className="text-2xl font-semibold text-[#0F172A]">12</p>
              </div>
              <div className="w-10 h-10 bg-[#DC2626]/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowDown className="w-4 h-4 text-[#059669]" />
              <span className="text-[#059669]">16% from last month</span>
            </div>
          </Card>

          {/* Pending Fine */}
          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Fine</p>
                <p className="text-2xl font-semibold text-[#0F172A]">₹500</p>
              </div>
              <div className="w-10 h-10 bg-[#D97706]/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#D97706]" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-600">1 violation unpaid</span>
            </div>
          </Card>

          {/* Behaviour Score */}
          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Behaviour Score</p>
                <p className="text-2xl font-semibold text-[#0F172A]">{currentScore}/100</p>
              </div>
              <div className="w-10 h-10 bg-[#D97706]/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-[#D97706]" />
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  currentScore >= 80 ? "bg-[#059669]" : currentScore >= 60 ? "bg-[#D97706]" : "bg-[#DC2626]"
                }`}
                style={{ width: `${currentScore}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Charts and Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Behaviour Score Trend Chart */}
            <Card className="bg-white border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#0F172A]">Behaviour Score Trend</h3>
                <p className="text-sm text-gray-600">Your performance over the last 6 months</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={behaviourTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis domain={[0, 100]} stroke="#6B7280" style={{ fontSize: '12px' }} />
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
                    dataKey="score"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    dot={{ fill: "#06B6D4", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* My Violations Table */}
            <Card className="bg-white border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#0F172A]">My Recent Violations</h3>
                <p className="text-sm text-gray-600">Track all your violations and fines</p>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Violation Type</TableHead>
                      <TableHead className="font-semibold">Fine</TableHead>
                      <TableHead className="font-semibold">Proof</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myViolations.map((violation) => (
                      <TableRow key={violation.id} className="hover:bg-gray-50">
                        <TableCell className="text-gray-700">{violation.date}</TableCell>
                        <TableCell>{getViolationTypeBadge(violation.violationType)}</TableCell>
                        <TableCell className="text-[#DC2626] font-semibold">
                          ₹{violation.fine}
                        </TableCell>
                        <TableCell>
                          <ImageWithFallback
                            src={violation.proofImage}
                            alt="Proof"
                            className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform"
                          />
                        </TableCell>
                        <TableCell>{getStatusBadge(violation.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Right Section - Score Breakdown */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#0F172A] mb-6">Score Breakdown</h3>

              {/* Circular Progress */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-36 h-36">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      stroke="#E5E7EB"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      stroke={currentScore >= 80 ? "#059669" : currentScore >= 60 ? "#D97706" : "#DC2626"}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(currentScore / 100) * 402} 402`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-semibold text-[#0F172A]">{currentScore}</p>
                      <p className="text-sm text-gray-600">Score</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm text-gray-600">Base Score: <span className="font-semibold text-[#0F172A]">100</span></p>
                <p className="text-sm text-gray-600">Total Deductions: <span className="font-semibold text-[#DC2626]">-28</span></p>
              </div>

              {/* Deduction Breakdown */}
              <div className="space-y-4">
                {scoreBreakdown.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{item.category}</p>
                      <span className="text-sm font-semibold text-[#DC2626]">{item.deduction}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${Math.abs(item.deduction) * 3}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Alert Card */}
            <Card className="bg-[#FEF2F2] border border-[#FEE2E2] p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#DC2626]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#0F172A] mb-2">Improvement Required</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Your behaviour score has decreased by 16% this month. Please follow safety guidelines to improve.
                  </p>
                  <Button size="sm" className="bg-[#06B6D4] hover:bg-[#0891B2] text-white">
                    View Guidelines
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}