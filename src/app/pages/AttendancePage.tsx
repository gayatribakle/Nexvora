import { Calendar, Download, Filter, Users, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
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
import { Progress } from "../components/ui/progress";

interface AttendanceRecord {
  workerId: string;
  workerName: string;
  photo: string;
  department: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: "Present" | "Absent" | "Late" | "Half Day";
  date: string;
}

const attendanceData: AttendanceRecord[] = [
  {
    workerId: "W001",
    workerName: "Rajesh Kumar",
    photo: "https://images.unsplash.com/photo-1694522362256-6c907336af43?w=100",
    department: "Construction",
    checkIn: "08:00 AM",
    checkOut: "05:00 PM",
    workHours: "9h 00m",
    status: "Present",
    date: "Mar 8, 2026",
  },
  {
    workerId: "W002",
    workerName: "Mohammed Ali",
    photo: "https://images.unsplash.com/photo-1582489851864-4b4bddaf6a1b?w=100",
    department: "Maintenance",
    checkIn: "08:15 AM",
    checkOut: "05:00 PM",
    workHours: "8h 45m",
    status: "Late",
    date: "Mar 8, 2026",
  },
  {
    workerId: "W003",
    workerName: "Suresh Patel",
    photo: "https://images.unsplash.com/photo-1666137270524-5131ac07314d?w=100",
    department: "Electrical",
    checkIn: "08:00 AM",
    checkOut: "05:00 PM",
    workHours: "9h 00m",
    status: "Present",
    date: "Mar 8, 2026",
  },
  {
    workerId: "W004",
    workerName: "Vijay Singh",
    photo: "",
    department: "Construction",
    checkIn: "-",
    checkOut: "-",
    workHours: "0h 00m",
    status: "Absent",
    date: "Mar 8, 2026",
  },
  {
    workerId: "W005",
    workerName: "Arun Sharma",
    photo: "",
    department: "Safety",
    checkIn: "08:00 AM",
    checkOut: "01:00 PM",
    workHours: "5h 00m",
    status: "Half Day",
    date: "Mar 8, 2026",
  },
  {
    workerId: "W006",
    workerName: "Prakash Yadav",
    photo: "",
    department: "Plumbing",
    checkIn: "08:30 AM",
    checkOut: "05:00 PM",
    workHours: "8h 30m",
    status: "Late",
    date: "Mar 8, 2026",
  },
  {
    workerId: "W007",
    workerName: "Ramesh Gupta",
    photo: "",
    department: "Electrical",
    checkIn: "08:00 AM",
    checkOut: "05:00 PM",
    workHours: "9h 00m",
    status: "Present",
    date: "Mar 8, 2026",
  },
  {
    workerId: "W008",
    workerName: "Deepak Verma",
    photo: "",
    department: "Construction",
    checkIn: "-",
    checkOut: "-",
    workHours: "0h 00m",
    status: "Absent",
    date: "Mar 8, 2026",
  },
];

export function AttendancePage() {
  const totalWorkers = 1247;
  const presentToday = 1189;
  const absentToday = 35;
  const lateToday = 18;
  const halfDayToday = 5;
  const attendanceRate = ((presentToday + lateToday + halfDayToday) / totalWorkers * 100).toFixed(1);

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    const statusConfig = {
      Present: { bg: "bg-[#059669]", text: "text-white", icon: CheckCircle2 },
      Late: { bg: "bg-[#D97706]", text: "text-white", icon: Clock },
      Absent: { bg: "bg-[#DC2626]", text: "text-white", icon: XCircle },
      "Half Day": { bg: "bg-[#0891B2]", text: "text-white", icon: AlertCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.bg} ${config.text} hover:${config.bg} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance Management</h1>
        <p className="text-gray-500">Track worker attendance and work hours</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Workers</p>
              <p className="text-2xl font-bold text-gray-900">{totalWorkers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#059669]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#059669]/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#059669]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Present Today</p>
              <p className="text-2xl font-bold text-[#059669]">{presentToday}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#DC2626]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-[#DC2626]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Absent Today</p>
              <p className="text-2xl font-bold text-[#DC2626]">{absentToday}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#D97706]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#D97706]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Late Arrivals</p>
              <p className="text-2xl font-bold text-[#D97706]">{lateToday}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#0891B2]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#0891B2]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-bold text-[#0891B2]">{attendanceRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance Rate Progress */}
      <Card className="p-6 shadow-lg bg-gradient-to-r from-[#059669]/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Today's Attendance Overview</h3>
            <p className="text-sm text-gray-500">Sunday, March 8, 2026</p>
          </div>
          <Badge className="bg-[#059669] text-white text-lg px-4 py-2">
            {attendanceRate}% Present
          </Badge>
        </div>
        <Progress value={parseFloat(attendanceRate)} className="h-3" />
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <span>0%</span>
          <span>Target: 95%</span>
          <span>100%</span>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="date"
                defaultValue="2026-03-08"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0891B2] focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Department</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
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
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="halfday">Half Day</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
            <Button className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#059669] text-white">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Worker ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Work Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceData.map((record) => (
              <TableRow key={record.workerId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={record.photo} />
                      <AvatarFallback className="bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-white">
                        {record.workerName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{record.workerName}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{record.workerId}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {record.department}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {record.checkIn !== "-" ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#059669]" />
                      {record.checkIn}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-600">
                  {record.checkOut !== "-" ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#DC2626]" />
                      {record.checkOut}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${
                    record.workHours === "0h 00m" ? "text-gray-400" : "text-[#0891B2]"
                  }`}>
                    {record.workHours}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(record.status)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 shadow-lg lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Summary</h3>
          <div className="space-y-3">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => {
              const attendance = 95 - Math.floor(Math.random() * 10);
              return (
                <div key={day}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{day}</span>
                    <span className="text-sm font-semibold text-[#0891B2]">{attendance}%</span>
                  </div>
                  <Progress value={attendance} className="h-2" />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 shadow-lg bg-gradient-to-br from-[#0891B2]/10 to-transparent">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-[#0891B2] to-[#06B6D4] hover:from-[#0e7490] hover:to-[#0891B2] text-white">
              <Download className="w-4 h-4 mr-2" />
              Download Monthly Report
            </Button>
            <Button variant="outline" className="w-full hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
            <Button variant="outline" className="w-full hover:bg-[#059669]/10 hover:border-[#059669] hover:text-[#059669]">
              <Users className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
            <Button variant="outline" className="w-full hover:bg-[#D97706]/10 hover:border-[#D97706] hover:text-[#D97706]">
              <AlertCircle className="w-4 h-4 mr-2" />
              View Absences
            </Button>
          </div>
        </Card>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">1-{attendanceData.length}</span> of{" "}
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
