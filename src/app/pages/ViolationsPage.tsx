import { Search, Filter, CheckCircle, XCircle, Eye, Calendar } from "lucide-react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const violations = [
  {
    id: "1",
    workerName: "Rajesh Kumar",
    workerId: "W001",
    violationType: "Helmet Safety Violation",
    fineAmount: 500,
    dateTime: "Mar 5, 2026 10:30 AM",
    proofImage: "https://images.unsplash.com/photo-1694522362256-6c907336af43?w=100",
    status: "Pending",
  },
  {
    id: "2",
    workerName: "Mohammed Ali",
    workerId: "W002",
    violationType: "Cleanliness Compliance Violation",
    fineAmount: 300,
    dateTime: "Mar 5, 2026 09:15 AM",
    proofImage: "https://images.unsplash.com/photo-1582489851864-4b4bddaf6a1b?w=100",
    status: "Pending",
  },
  {
    id: "3",
    workerName: "Suresh Patel",
    workerId: "W003",
    violationType: "Unattended Tap Detection",
    fineAmount: 200,
    dateTime: "Mar 5, 2026 08:45 AM",
    proofImage: "https://images.unsplash.com/photo-1666137270524-5131ac07314d?w=100",
    status: "Approved",
  },
  {
    id: "4",
    workerName: "Vijay Singh",
    workerId: "W004",
    violationType: "Helmet Safety Violation",
    fineAmount: 500,
    dateTime: "Mar 4, 2026 03:20 PM",
    proofImage: "https://images.unsplash.com/photo-1694522362256-6c907336af43?w=100",
    status: "Approved",
  },
  {
    id: "5",
    workerName: "Arun Sharma",
    workerId: "W005",
    violationType: "Cleanliness Compliance Violation",
    fineAmount: 300,
    dateTime: "Mar 4, 2026 02:10 PM",
    proofImage: "https://images.unsplash.com/photo-1582489851864-4b4bddaf6a1b?w=100",
    status: "Rejected",
  },
  {
    id: "6",
    workerName: "Prakash Yadav",
    workerId: "W006",
    violationType: "Unattended Tap Detection",
    fineAmount: 200,
    dateTime: "Mar 4, 2026 01:30 PM",
    proofImage: "https://images.unsplash.com/photo-1666137270524-5131ac07314d?w=100",
    status: "Approved",
  },
  {
    id: "7",
    workerName: "Ramesh Gupta",
    workerId: "W007",
    violationType: "Helmet Safety Violation",
    fineAmount: 500,
    dateTime: "Mar 4, 2026 11:00 AM",
    proofImage: "https://images.unsplash.com/photo-1694522362256-6c907336af43?w=100",
    status: "Approved",
  },
];

export function ViolationsPage() {
  const getViolationTypeBadge = (type: string) => {
    if (type.includes("Helmet")) {
      return <Badge className="bg-[#DC2626] text-white hover:bg-[#DC2626]">{type}</Badge>;
    }
    if (type.includes("Cleanliness")) {
      return <Badge className="bg-[#D97706] text-white hover:bg-[#D97706]">{type}</Badge>;
    }
    return <Badge className="bg-[#0891B2] text-white hover:bg-[#0891B2]">{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "Approved") {
      return <Badge className="bg-[#059669] text-white hover:bg-[#059669]">Approved</Badge>;
    }
    if (status === "Rejected") {
      return <Badge className="bg-[#DC2626] text-white hover:bg-[#DC2626]">Rejected</Badge>;
    }
    return <Badge className="bg-[#D97706] text-white hover:bg-[#D97706]">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Violations Management</h1>
        <p className="text-gray-500">Review and manage all detected violations</p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search violations by worker name or ID..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Violation Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="helmet">Helmet Safety Violation</SelectItem>
                <SelectItem value="garbage">Cleanliness Compliance Violation</SelectItem>
                <SelectItem value="tap">Unattended Tap Detection</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
          </div>
        </div>
      </Card>

      {/* Violations Table */}
      <Card className="shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Violation ID</TableHead>
              <TableHead>Worker Name</TableHead>
              <TableHead>Violation Type</TableHead>
              <TableHead>Fine Amount</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Proof Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {violations.map((violation) => (
              <TableRow key={violation.id}>
                <TableCell className="font-medium text-[#0891B2]">
                  {violation.id}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{violation.workerName}</p>
                    <p className="text-sm text-gray-500">{violation.workerId}</p>
                  </div>
                </TableCell>
                <TableCell>{getViolationTypeBadge(violation.violationType)}</TableCell>
                <TableCell className="text-[#DC2626] font-semibold">
                  ₹{violation.fineAmount}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {violation.dateTime}
                </TableCell>
                <TableCell>
                  <ImageWithFallback
                    src={violation.proofImage}
                    alt="Proof"
                    className="w-12 h-12 rounded object-cover cursor-pointer hover:scale-110 transition-transform"
                  />
                </TableCell>
                <TableCell>{getStatusBadge(violation.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    {violation.status === "Pending" ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-[#059669] hover:bg-[#047857] text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#DC2626] border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 shadow-lg">
          <p className="text-sm text-gray-500 mb-1">Total Violations</p>
          <p className="text-2xl font-bold text-gray-900">156</p>
        </Card>
        <Card className="p-4 shadow-lg">
          <p className="text-sm text-gray-500 mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-[#D97706]">23</p>
        </Card>
        <Card className="p-4 shadow-lg">
          <p className="text-sm text-gray-500 mb-1">Approved</p>
          <p className="text-2xl font-bold text-[#059669]">118</p>
        </Card>
        <Card className="p-4 shadow-lg">
          <p className="text-sm text-gray-500 mb-1">Total Fines</p>
          <p className="text-2xl font-bold text-[#DC2626]">₹52,400</p>
        </Card>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">1-7</span> of{" "}
          <span className="font-semibold">156</span> violations
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