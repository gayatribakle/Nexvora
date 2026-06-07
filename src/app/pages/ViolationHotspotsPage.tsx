import { MapPin, AlertTriangle, TrendingUp, Download, Eye, Filter, Map as MapIcon } from "lucide-react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface Hotspot {
  id: string;
  area: string;
  zone: string;
  totalViolations: number;
  helmetViolations: number;
  cleanlinessViolations: number;
  tapViolations: number;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  lastIncident: string;
  trend: "increasing" | "decreasing" | "stable";
}

const hotspots: Hotspot[] = [
  {
    id: "1",
    area: "Construction Site - Block A",
    zone: "Zone 1",
    totalViolations: 142,
    helmetViolations: 85,
    cleanlinessViolations: 38,
    tapViolations: 19,
    riskLevel: "Critical",
    lastIncident: "2 hours ago",
    trend: "increasing"
  },
  {
    id: "2",
    area: "Worker Accommodation - North Wing",
    zone: "Zone 2",
    totalViolations: 98,
    helmetViolations: 12,
    cleanlinessViolations: 68,
    tapViolations: 18,
    riskLevel: "High",
    lastIncident: "5 hours ago",
    trend: "stable"
  },
  {
    id: "3",
    area: "Electrical Workshop",
    zone: "Zone 3",
    totalViolations: 76,
    helmetViolations: 52,
    cleanlinessViolations: 15,
    tapViolations: 9,
    riskLevel: "High",
    lastIncident: "1 day ago",
    trend: "decreasing"
  },
  {
    id: "4",
    area: "Plumbing Assembly Area",
    zone: "Zone 4",
    totalViolations: 54,
    helmetViolations: 18,
    cleanlinessViolations: 12,
    tapViolations: 24,
    riskLevel: "Medium",
    lastIncident: "6 hours ago",
    trend: "stable"
  },
  {
    id: "5",
    area: "Main Cafeteria",
    zone: "Zone 5",
    totalViolations: 38,
    helmetViolations: 5,
    cleanlinessViolations: 28,
    tapViolations: 5,
    riskLevel: "Medium",
    lastIncident: "3 hours ago",
    trend: "increasing"
  },
  {
    id: "6",
    area: "Storage Warehouse",
    zone: "Zone 6",
    totalViolations: 22,
    helmetViolations: 15,
    cleanlinessViolations: 4,
    tapViolations: 3,
    riskLevel: "Low",
    lastIncident: "2 days ago",
    trend: "decreasing"
  }
];

// Data for visualization
const zoneComparisonData = hotspots.map(h => ({
  zone: h.zone,
  total: h.totalViolations,
  helmet: h.helmetViolations,
  cleanliness: h.cleanlinessViolations,
  tap: h.tapViolations
}));

const radarData = [
  { category: "Helmet Safety", value: 187 },
  { category: "Cleanliness", value: 165 },
  { category: "Water Conservation", value: 78 },
  { category: "Safety Equipment", value: 95 },
  { category: "Work Area Hygiene", value: 132 },
  { category: "Emergency Exits", value: 45 }
];

export function ViolationHotspotsPage() {
  const getRiskBadge = (level: Hotspot["riskLevel"]) => {
    const config = {
      Critical: { bg: "bg-[#DC2626]", text: "text-white", pulse: true },
      High: { bg: "bg-[#D97706]", text: "text-white", pulse: false },
      Medium: { bg: "bg-[#0891B2]", text: "text-white", pulse: false },
      Low: { bg: "bg-[#059669]", text: "text-white", pulse: false }
    };
    const c = config[level];
    return (
      <Badge className={`${c.bg} ${c.text} ${c.pulse ? 'animate-pulse' : ''}`}>
        {level} Risk
      </Badge>
    );
  };

  const getTrendIcon = (trend: Hotspot["trend"]) => {
    if (trend === "increasing") return <TrendingUp className="w-4 h-4 text-[#DC2626]" />;
    if (trend === "decreasing") return <TrendingUp className="w-4 h-4 text-[#059669] rotate-180" />;
    return <span className="text-[#D97706]">→</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Violation Hotspots Tracking</h1>
          <p className="text-gray-500">Identify and monitor violation-prone areas across the worksite</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
            <Download className="w-4 h-4 mr-2" />
            Export Hotspot Report
          </Button>
          <Button className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#DC2626] text-white">
            <Eye className="w-4 h-4 mr-2" />
            Live Camera View
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-6 shadow-lg border-l-4 border-[#DC2626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Hotspots</p>
              <p className="text-2xl font-bold text-gray-900">6</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#DC2626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Critical Areas</p>
              <p className="text-2xl font-bold text-[#DC2626]">1</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#D97706]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">High Risk Areas</p>
              <p className="text-2xl font-bold text-[#D97706]">2</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#0891B2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#0891B2]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Violations</p>
              <p className="text-2xl font-bold text-gray-900">430</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#059669]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#059669]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#059669] rotate-180" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Reduction</p>
              <p className="text-2xl font-bold text-[#059669]">12.5%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Risk Level</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Violation Type</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="helmet">Helmet Safety Violation</SelectItem>
                <SelectItem value="cleanliness">Cleanliness Compliance Violation</SelectItem>
                <SelectItem value="tap">Unattended Tap Detection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
            <Select defaultValue="7days">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Hotspot Map Visualization */}
      <Card className="p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Worksite Hotspot Map</h3>
          <Button size="sm" variant="outline">
            <MapIcon className="w-4 h-4 mr-2" />
            3D View
          </Button>
        </div>
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-8 min-h-[400px] relative">
          {/* Simulated Map with Hotspot Markers */}
          <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full">
            {hotspots.map((hotspot, index) => (
              <div
                key={hotspot.id}
                className={`relative bg-white rounded-lg p-4 shadow-lg border-2 ${
                  hotspot.riskLevel === "Critical" ? "border-[#DC2626] animate-pulse" :
                  hotspot.riskLevel === "High" ? "border-[#D97706]" :
                  hotspot.riskLevel === "Medium" ? "border-[#0891B2]" : "border-[#059669]"
                } hover:scale-105 transition-transform cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-2">
                  <MapPin className={`w-6 h-6 ${
                    hotspot.riskLevel === "Critical" ? "text-[#DC2626]" :
                    hotspot.riskLevel === "High" ? "text-[#D97706]" :
                    hotspot.riskLevel === "Medium" ? "text-[#0891B2]" : "text-[#059669]"
                  }`} />
                  {getRiskBadge(hotspot.riskLevel)}
                </div>
                <h4 className="font-semibold text-sm text-gray-900 mb-1">{hotspot.area}</h4>
                <p className="text-xs text-gray-500 mb-2">{hotspot.zone}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">{hotspot.totalViolations}</span>
                  {getTrendIcon(hotspot.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Violations by Zone</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zoneComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zone" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="helmet" name="Helmet Safety" fill="#DC2626" radius={[8, 8, 0, 0]} />
              <Bar dataKey="cleanliness" name="Cleanliness" fill="#D97706" radius={[8, 8, 0, 0]} />
              <Bar dataKey="tap" name="Unattended Tap" fill="#0891B2" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Category Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis />
              <Radar name="Violations" dataKey="value" stroke="#DC2626" fill="#DC2626" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Hotspot List */}
      <Card className="p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hotspot Details</h3>
        <div className="space-y-4">
          {hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              className={`p-4 border-l-4 rounded-lg ${
                hotspot.riskLevel === "Critical" ? "border-[#DC2626] bg-[#DC2626]/5" :
                hotspot.riskLevel === "High" ? "border-[#D97706] bg-[#D97706]/5" :
                hotspot.riskLevel === "Medium" ? "border-[#0891B2] bg-[#0891B2]/5" :
                "border-[#059669] bg-[#059669]/5"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{hotspot.area}</h4>
                    {getRiskBadge(hotspot.riskLevel)}
                    <Badge variant="outline">{hotspot.zone}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Last incident: {hotspot.lastIncident}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{hotspot.totalViolations}</p>
                  <p className="text-sm text-gray-500">Total Violations</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#DC2626]"></div>
                    <span className="text-xs text-gray-600">Helmet Safety</span>
                  </div>
                  <p className="text-xl font-bold text-[#DC2626]">{hotspot.helmetViolations}</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#D97706]"></div>
                    <span className="text-xs text-gray-600">Cleanliness</span>
                  </div>
                  <p className="text-xl font-bold text-[#D97706]">{hotspot.cleanlinessViolations}</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-[#0891B2]"></div>
                    <span className="text-xs text-gray-600">Unattended Tap</span>
                  </div>
                  <p className="text-xl font-bold text-[#0891B2]">{hotspot.tapViolations}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Trend:</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(hotspot.trend)}
                    <span className={`text-sm font-medium ${
                      hotspot.trend === "increasing" ? "text-[#DC2626]" :
                      hotspot.trend === "decreasing" ? "text-[#059669]" : "text-[#D97706]"
                    }`}>
                      {hotspot.trend.charAt(0).toUpperCase() + hotspot.trend.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
                    <Eye className="w-3 h-3 mr-1" />
                    View Cameras
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-[#DC2626]/10 hover:border-[#DC2626] hover:text-[#DC2626]">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Set Alert
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6 shadow-lg bg-gradient-to-r from-[#0891B2]/10 to-transparent">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border-l-4 border-[#DC2626]">
            <h4 className="font-semibold text-gray-900 mb-2">Immediate Action Required</h4>
            <p className="text-sm text-gray-600 mb-3">
              Deploy additional safety officers to Construction Site - Block A
            </p>
            <Button size="sm" className="bg-[#DC2626] hover:bg-[#B91C1C] text-white">
              Take Action
            </Button>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-[#D97706]">
            <h4 className="font-semibold text-gray-900 mb-2">Increase Monitoring</h4>
            <p className="text-sm text-gray-600 mb-3">
              Add camera coverage in Worker Accommodation - North Wing
            </p>
            <Button size="sm" className="bg-[#D97706] hover:bg-[#B45309] text-white">
              Schedule
            </Button>
          </div>
          <div className="bg-white p-4 rounded-lg border-l-4 border-[#059669]">
            <h4 className="font-semibold text-gray-900 mb-2">Best Practice</h4>
            <p className="text-sm text-gray-600 mb-3">
              Storage Warehouse shows reduced violations - replicate approach
            </p>
            <Button size="sm" className="bg-[#059669] hover:bg-[#047857] text-white">
              View Details
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
