import { Database, Download, Search, Filter, UserPlus, Edit, Trash2, Eye, Phone, Mail, MapPin } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface WorkerData {
  id: string;
  name: string;
  photo: string;
  employeeId: string;
  department: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  joiningDate: string;
  aadhar: string;
  bankAccount: string;
  emergencyContact: string;
  behaviorScore: number;
  totalViolations: number;
  attendance: number;
  status: "Active" | "On Leave" | "Inactive";
}

const workerDatabase: WorkerData[] = [
  {
    id: "1",
    name: "Rajesh Kumar",
    photo: "https://images.unsplash.com/photo-1694522362256-6c907336af43?w=100",
    employeeId: "W001",
    department: "Construction",
    role: "Mason",
    phone: "+91 98765 43210",
    email: "rajesh.kumar@nexvora.com",
    address: "Block A, Labour Colony, Site Road, Mumbai - 400001",
    joiningDate: "Jan 15, 2024",
    aadhar: "XXXX-XXXX-1234",
    bankAccount: "XXXX-XXXX-5678",
    emergencyContact: "+91 98765 11111",
    behaviorScore: 92,
    totalViolations: 3,
    attendance: 96.5,
    status: "Active"
  },
  {
    id: "2",
    name: "Mohammed Ali",
    photo: "https://images.unsplash.com/photo-1582489851864-4b4bddaf6a1b?w=100",
    employeeId: "W002",
    department: "Electrical",
    role: "Electrician",
    phone: "+91 98765 43211",
    email: "mohammed.ali@nexvora.com",
    address: "Block B, Labour Colony, Site Road, Mumbai - 400001",
    joiningDate: "Feb 10, 2024",
    aadhar: "XXXX-XXXX-2345",
    bankAccount: "XXXX-XXXX-6789",
    emergencyContact: "+91 98765 22222",
    behaviorScore: 88,
    totalViolations: 5,
    attendance: 94.2,
    status: "Active"
  },
  {
    id: "3",
    name: "Suresh Patel",
    photo: "https://images.unsplash.com/photo-1666137270524-5131ac07314d?w=100",
    employeeId: "W003",
    department: "Plumbing",
    role: "Plumber",
    phone: "+91 98765 43212",
    email: "suresh.patel@nexvora.com",
    address: "Block A, Labour Colony, Site Road, Mumbai - 400001",
    joiningDate: "Jan 20, 2024",
    aadhar: "XXXX-XXXX-3456",
    bankAccount: "XXXX-XXXX-7890",
    emergencyContact: "+91 98765 33333",
    behaviorScore: 95,
    totalViolations: 2,
    attendance: 97.8,
    status: "Active"
  },
  {
    id: "4",
    name: "Vijay Singh",
    photo: "",
    employeeId: "W004",
    department: "Safety",
    role: "Safety Officer",
    phone: "+91 98765 43213",
    email: "vijay.singh@nexvora.com",
    address: "Block C, Labour Colony, Site Road, Mumbai - 400001",
    joiningDate: "Dec 5, 2023",
    aadhar: "XXXX-XXXX-4567",
    bankAccount: "XXXX-XXXX-8901",
    emergencyContact: "+91 98765 44444",
    behaviorScore: 78,
    totalViolations: 8,
    attendance: 89.5,
    status: "On Leave"
  },
  {
    id: "5",
    name: "Arun Sharma",
    photo: "",
    employeeId: "W005",
    department: "Construction",
    role: "Helper",
    phone: "+91 98765 43214",
    email: "arun.sharma@nexvora.com",
    address: "Block B, Labour Colony, Site Road, Mumbai - 400001",
    joiningDate: "Mar 1, 2024",
    aadhar: "XXXX-XXXX-5678",
    bankAccount: "XXXX-XXXX-9012",
    emergencyContact: "+91 98765 55555",
    behaviorScore: 85,
    totalViolations: 6,
    attendance: 92.3,
    status: "Active"
  }
];

export function LabourDataPage() {
  const getStatusBadge = (status: WorkerData["status"]) => {
    const config = {
      Active: { bg: "bg-[#059669]", text: "text-white" },
      "On Leave": { bg: "bg-[#D97706]", text: "text-white" },
      Inactive: { bg: "bg-[#DC2626]", text: "text-white" }
    };
    const c = config[status];
    return <Badge className={`${c.bg} ${c.text}`}>{status}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#059669]";
    if (score >= 75) return "text-[#0891B2]";
    if (score >= 60) return "text-[#D97706]";
    return "text-[#DC2626]";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Labour Data Management</h1>
          <p className="text-gray-500">Centralized database of all worker information</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
          <Button className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#059669] text-white">
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Worker
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-6 shadow-lg border-l-4 border-[#0891B2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-[#0891B2]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#059669]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#059669]/10 flex items-center justify-center">
              <Badge className="bg-[#059669] text-white">A</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Workers</p>
              <p className="text-2xl font-bold text-gray-900">1,189</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#D97706]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
              <Badge className="bg-[#D97706] text-white">L</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">On Leave</p>
              <p className="text-2xl font-bold text-gray-900">35</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#DC2626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
              <Badge className="bg-[#DC2626] text-white">I</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#7C3AED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">42</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Search Workers</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name, ID, phone, or email..."
                className="pl-10"
              />
            </div>
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
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </Card>

      {/* Worker Database Table */}
      <Card className="shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker Details</TableHead>
              <TableHead>Contact Information</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead className="text-center">Behavior Score</TableHead>
              <TableHead className="text-center">Attendance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workerDatabase.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={worker.photo} />
                      <AvatarFallback className="bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-white">
                        {worker.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{worker.name}</p>
                      <p className="text-sm text-gray-500">{worker.employeeId} • {worker.role}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{worker.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600 truncate max-w-[200px]">{worker.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{worker.department}</Badge>
                </TableCell>
                <TableCell className="text-gray-600">{worker.joiningDate}</TableCell>
                <TableCell className="text-center">
                  <div className={`text-xl font-bold ${getScoreColor(worker.behaviorScore)}`}>
                    {worker.behaviorScore}
                  </div>
                  <div className="text-xs text-gray-500">{worker.totalViolations} violations</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="text-lg font-semibold text-[#0891B2]">{worker.attendance}%</div>
                </TableCell>
                <TableCell>{getStatusBadge(worker.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="hover:bg-[#059669]/10 hover:border-[#059669] hover:text-[#059669]">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="hover:bg-[#DC2626]/10 hover:border-[#DC2626] hover:text-[#DC2626]">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Data Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
          <div className="space-y-3">
            {["Construction", "Electrical", "Plumbing", "Safety", "Maintenance"].map((dept, index) => {
              const count = [450, 180, 120, 90, 250][index];
              const percentage = ((count / 1247) * 100).toFixed(1);
              return (
                <div key={dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{dept}</span>
                    <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#0891B2] to-[#06B6D4] h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 shadow-lg bg-gradient-to-br from-[#0891B2]/10 to-transparent">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Avg Behavior Score</span>
              <span className="text-lg font-bold text-[#0891B2]">86.4</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Avg Attendance</span>
              <span className="text-lg font-bold text-[#059669]">94.9%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Total Violations</span>
              <span className="text-lg font-bold text-[#DC2626]">913</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Avg Experience</span>
              <span className="text-lg font-bold text-[#D97706]">2.3 yrs</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Actions</h3>
          <div className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-[#0891B2] to-[#06B6D4] hover:from-[#0e7490] hover:to-[#0891B2] text-white">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
            <Button variant="outline" className="w-full hover:bg-[#059669]/10 hover:border-[#059669] hover:text-[#059669]">
              <Download className="w-4 h-4 mr-2" />
              Download PDF Report
            </Button>
            <Button variant="outline" className="w-full hover:bg-[#D97706]/10 hover:border-[#D97706] hover:text-[#D97706]">
              <UserPlus className="w-4 h-4 mr-2" />
              Bulk Import Workers
            </Button>
            <Button variant="outline" className="w-full hover:bg-[#DC2626]/10 hover:border-[#DC2626] hover:text-[#DC2626]">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </Card>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">1-5</span> of{" "}
          <span className="font-semibold">1,247</span> workers
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm" className="bg-[#0891B2] text-white hover:bg-[#0891B2]/90 hover:text-white">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}
