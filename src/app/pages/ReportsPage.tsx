import { FileText, Download, TrendingUp, DollarSign, AlertTriangle, Users, Calendar, BarChart3, PieChart as PieChartIcon, FileSpreadsheet } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  AreaChart,
  Area,
} from "recharts";

// Monthly Violation Trends
const monthlyViolationData = [
  { month: "Sep", helmet: 65, garbage: 40, tap: 35, other: 20 },
  { month: "Oct", helmet: 59, garbage: 48, tap: 38, other: 25 },
  { month: "Nov", helmet: 70, garbage: 52, tap: 42, other: 28 },
  { month: "Dec", helmet: 58, garbage: 45, tap: 40, other: 22 },
  { month: "Jan", helmet: 62, garbage: 50, tap: 38, other: 26 },
  { month: "Feb", helmet: 55, garbage: 42, tap: 32, other: 20 },
  { month: "Mar", helmet: 48, garbage: 35, tap: 28, other: 18 },
];

// Financial Data
const monthlyFinancialData = [
  { month: "Sep", collected: 45000, pending: 8000 },
  { month: "Oct", collected: 52000, pending: 6500 },
  { month: "Nov", collected: 58000, pending: 7200 },
  { month: "Dec", collected: 48000, pending: 5800 },
  { month: "Jan", collected: 55000, pending: 6000 },
  { month: "Feb", collected: 50000, pending: 5500 },
  { month: "Mar", collected: 18500, pending: 4200 },
];

// Department Performance
const departmentPerformanceData = [
  { department: "Construction", score: 82, workers: 450 },
  { department: "Electrical", score: 91, workers: 180 },
  { department: "Plumbing", score: 76, workers: 120 },
  { department: "Maintenance", score: 88, workers: 250 },
  { department: "Safety", score: 95, workers: 90 },
];

// Violation Distribution
const violationDistribution = [
  { name: "Helmet Safety Violation", value: 385, percentage: 42 },
  { name: "Cleanliness Compliance Violation", value: 312, percentage: 34 },
  { name: "Unattended Tap Detection", value: 153, percentage: 17 },
  { name: "Other", value: 63, percentage: 7 },
];

const COLORS = ["#DC2626", "#D97706", "#0891B2", "#64748B"];

// Attendance Trend
const attendanceTrendData = [
  { week: "Week 1", attendance: 94.2 },
  { week: "Week 2", attendance: 95.8 },
  { week: "Week 3", attendance: 93.5 },
  { week: "Week 4", attendance: 96.1 },
];

export function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-500">Comprehensive insights and data analysis</p>
        </div>
        <Button className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#059669] text-white">
          <Download className="w-4 h-4 mr-2" />
          Export All Reports
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 shadow-lg border-l-4 border-[#DC2626]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Violations</p>
              <p className="text-2xl font-bold text-gray-900">913</p>
              <p className="text-xs text-[#059669] flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                -12% this month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#059669]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#059669]/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#059669]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Fine Collected</p>
              <p className="text-2xl font-bold text-gray-900">₹3.26L</p>
              <p className="text-xs text-[#059669] flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +8% this month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#0891B2]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#0891B2]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">94.9%</p>
              <p className="text-xs text-[#059669] flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +2.1% this month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#D97706]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#D97706]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Behaviour Score</p>
              <p className="text-2xl font-bold text-gray-900">86.4</p>
              <p className="text-xs text-[#059669] flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +5.2 this month
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Report Filters */}
      <Card className="p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
            <Select defaultValue="last30">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="thismonth">This Month</SelectItem>
                <SelectItem value="lastmonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Department</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Report Type</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="violations">Violations</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="bg-[#0891B2] hover:bg-[#0e7490] text-white">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </Card>

      {/* Detailed Reports Tabs */}
      <Tabs defaultValue="violations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="violations" className="data-[state=active]:bg-[#DC2626] data-[state=active]:text-white">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-[#059669] data-[state=active]:text-white">
            <DollarSign className="w-4 h-4 mr-2" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-[#0891B2] data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-[#D97706] data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Violations Report */}
        <TabsContent value="violations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 shadow-lg lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Violation Trends</h3>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyViolationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="helmet" name="Helmet" fill="#DC2626" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="garbage" name="Garbage" fill="#D97706" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="tap" name="Tap" fill="#0891B2" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="other" name="Other" fill="#64748B" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Violation Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={violationDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {violationDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {violationDistribution.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Violation Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 shadow-lg">
              <p className="text-sm text-gray-500 mb-1">Most Common Violation</p>
              <p className="text-xl font-bold text-[#DC2626]">Helmet Safety Violation</p>
              <p className="text-sm text-gray-600 mt-1">385 incidents (42%)</p>
            </Card>
            <Card className="p-4 shadow-lg">
              <p className="text-sm text-gray-500 mb-1">Peak Violation Time</p>
              <p className="text-xl font-bold text-[#D97706]">2:00 PM - 4:00 PM</p>
              <p className="text-sm text-gray-600 mt-1">Post-lunch period</p>
            </Card>
            <Card className="p-4 shadow-lg">
              <p className="text-sm text-gray-500 mb-1">Most Affected Department</p>
              <p className="text-xl font-bold text-[#0891B2]">Construction</p>
              <p className="text-sm text-gray-600 mt-1">542 violations</p>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Report */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Fine Collection Trend</h3>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyFinancialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="collected" 
                    name="Collected" 
                    stackId="1" 
                    stroke="#059669" 
                    fill="#059669" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pending" 
                    name="Pending" 
                    stackId="2" 
                    stroke="#D97706" 
                    fill="#D97706" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#059669]/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#059669] flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Collected (7 months)</p>
                      <p className="text-2xl font-bold text-gray-900">₹3,26,500</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#D97706]/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#D97706] flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending Collection</p>
                      <p className="text-2xl font-bold text-gray-900">₹43,200</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#0891B2]/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0891B2] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Collection Rate</p>
                      <p className="text-2xl font-bold text-gray-900">88.3%</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Financial Breakdown */}
          <Card className="p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fine Breakdown by Violation Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 border-l-4 border-[#DC2626] bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Helmet Violations</p>
                <p className="text-2xl font-bold text-gray-900">₹1,92,500</p>
                <p className="text-xs text-gray-500 mt-1">59% of total</p>
              </div>
              <div className="p-4 border-l-4 border-[#D97706] bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Cleanliness Violations</p>
                <p className="text-2xl font-bold text-gray-900">₹93,600</p>
                <p className="text-xs text-gray-500 mt-1">29% of total</p>
              </div>
              <div className="p-4 border-l-4 border-[#0891B2] bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Tap Violations</p>
                <p className="text-2xl font-bold text-gray-900">₹30,600</p>
                <p className="text-xs text-gray-500 mt-1">9% of total</p>
              </div>
              <div className="p-4 border-l-4 border-[#64748B] bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">Other Violations</p>
                <p className="text-2xl font-bold text-gray-900">₹9,800</p>
                <p className="text-xs text-gray-500 mt-1">3% of total</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Attendance Report */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Attendance Trend</h3>
                <Button size="sm" variant="outline">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    name="Attendance %"
                    stroke="#0891B2"
                    strokeWidth={3}
                    dot={{ fill: "#0891B2", r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Attendance Statistics</h3>
              <div className="space-y-4">
                <div className="p-4 bg-[#059669]/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Attendance</span>
                    <span className="text-lg font-bold text-[#059669]">94.9%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#059669] h-2 rounded-full" style={{ width: "94.9%" }}></div>
                  </div>
                </div>

                <div className="p-4 bg-[#DC2626]/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Absenteeism</span>
                    <span className="text-lg font-bold text-[#DC2626]">2.8%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#DC2626] h-2 rounded-full" style={{ width: "2.8%" }}></div>
                  </div>
                </div>

                <div className="p-4 bg-[#D97706]/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Late Arrivals</span>
                    <span className="text-lg font-bold text-[#D97706]">1.4%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#D97706] h-2 rounded-full" style={{ width: "1.4%" }}></div>
                  </div>
                </div>

                <div className="p-4 bg-[#0891B2]/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Half Day</span>
                    <span className="text-lg font-bold text-[#0891B2]">0.9%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#0891B2] h-2 rounded-full" style={{ width: "0.9%" }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Report */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Department Performance Overview</h3>
              <Button size="sm" variant="outline">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="space-y-4">
              {departmentPerformanceData.map((dept) => (
                <div key={dept.department} className="p-4 border border-gray-200 rounded-lg hover:border-[#0891B2] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        dept.score >= 90 ? "bg-[#059669]/10" :
                        dept.score >= 80 ? "bg-[#0891B2]/10" :
                        dept.score >= 70 ? "bg-[#D97706]/10" : "bg-[#DC2626]/10"
                      }`}>
                        <Users className={`w-5 h-5 ${
                          dept.score >= 90 ? "text-[#059669]" :
                          dept.score >= 80 ? "text-[#0891B2]" :
                          dept.score >= 70 ? "text-[#D97706]" : "text-[#DC2626]"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{dept.department}</p>
                        <p className="text-sm text-gray-500">{dept.workers} workers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        dept.score >= 90 ? "text-[#059669]" :
                        dept.score >= 80 ? "text-[#0891B2]" :
                        dept.score >= 70 ? "text-[#D97706]" : "text-[#DC2626]"
                      }`}>{dept.score}</p>
                      <p className="text-xs text-gray-500">Avg Score</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        dept.score >= 90 ? "bg-[#059669]" :
                        dept.score >= 80 ? "bg-[#0891B2]" :
                        dept.score >= 70 ? "bg-[#D97706]" : "bg-[#DC2626]"
                      }`}
                      style={{ width: `${dept.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Export Options */}
      <Card className="p-6 shadow-lg bg-gradient-to-r from-[#0891B2]/10 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Export</h3>
            <p className="text-sm text-gray-600">Download reports in different formats</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="hover:bg-[#DC2626]/10 hover:border-[#DC2626] hover:text-[#DC2626]">
              <FileText className="w-4 h-4 mr-2" />
              PDF Report
            </Button>
            <Button variant="outline" className="hover:bg-[#059669]/10 hover:border-[#059669] hover:text-[#059669]">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel Sheet
            </Button>
            <Button variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
              <Download className="w-4 h-4 mr-2" />
              CSV Data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}