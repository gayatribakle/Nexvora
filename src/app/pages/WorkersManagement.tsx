import { Search, Filter, Eye, Ban } from "lucide-react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
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
import { getWorkersWithResetScores } from "../utils/workerData";

export function WorkersManagement() {
  const workers = getWorkersWithResetScores();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#059669]";
    if (score >= 60) return "text-[#D97706]";
    return "text-[#DC2626]";
  };

  const getStatusBadge = (status: string) => {
    if (status === "Active") {
      return <Badge className="bg-[#059669] text-white hover:bg-[#059669]">Active</Badge>;
    }
    return <Badge className="bg-[#DC2626] text-white hover:bg-[#DC2626]">Suspended</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Workers Management</h1>
        <p className="text-gray-500">Manage and monitor all labour camp workers</p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search workers by name or ID..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Behaviour Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High (80+)</SelectItem>
                <SelectItem value="medium">Medium (60-79)</SelectItem>
                <SelectItem value="low">Low (&lt;60)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Workers Table */}
      <Card className="shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker Photo</TableHead>
              <TableHead>Worker Name</TableHead>
              <TableHead>Worker ID</TableHead>
              <TableHead>Behaviour Score</TableHead>
              <TableHead>Total Fine</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={worker.photo} />
                    <AvatarFallback className="bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-white">
                      {worker.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{worker.name}</TableCell>
                <TableCell className="text-gray-600">{worker.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                      <div
                        className={`h-2 rounded-full ${
                          worker.behaviourScore >= 80
                            ? "bg-[#059669]"
                            : worker.behaviourScore >= 60
                            ? "bg-[#D97706]"
                            : "bg-[#DC2626]"
                        }`}
                        style={{ width: `${worker.behaviourScore}%` }}
                      ></div>
                    </div>
                    <span className={`font-semibold ${getScoreColor(worker.behaviourScore)}`}>
                      {worker.behaviourScore}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-[#DC2626] font-semibold">
                  ₹{worker.totalFine.toLocaleString()}
                </TableCell>
                <TableCell>{getStatusBadge(worker.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[#DC2626] border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Suspend
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">1-{workers.length}</span> of{" "}
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