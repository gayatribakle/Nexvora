import { CreditCard, Send, DollarSign, Users, CheckCircle, Clock, XCircle, Download, Filter, Calendar } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface Payment {
  id: string;
  workerId: string;
  workerName: string;
  photo: string;
  amount: number;
  paymentType: "Salary" | "Bonus" | "Overtime" | "Advance";
  paymentMethod: "Bank Transfer" | "UPI" | "Cash";
  status: "Pending" | "Processing" | "Completed" | "Failed";
  date: string;
  transactionId: string;
  bankAccount: string;
}

const payments: Payment[] = [
  {
    id: "1",
    workerId: "W001",
    workerName: "Rajesh Kumar",
    photo: "https://images.unsplash.com/photo-1694522362256-6c907336af43?w=100",
    amount: 25000,
    paymentType: "Salary",
    paymentMethod: "Bank Transfer",
    status: "Completed",
    date: "Mar 10, 2026",
    transactionId: "TXN123456789",
    bankAccount: "XXXX-XXXX-5678"
  },
  {
    id: "2",
    workerId: "W002",
    workerName: "Mohammed Ali",
    photo: "https://images.unsplash.com/photo-1582489851864-4b4bddaf6a1b?w=100",
    amount: 28000,
    paymentType: "Salary",
    paymentMethod: "Bank Transfer",
    status: "Processing",
    date: "Mar 10, 2026",
    transactionId: "TXN123456790",
    bankAccount: "XXXX-XXXX-6789"
  },
  {
    id: "3",
    workerId: "W003",
    workerName: "Suresh Patel",
    photo: "https://images.unsplash.com/photo-1666137270524-5131ac07314d?w=100",
    amount: 5000,
    paymentType: "Bonus",
    paymentMethod: "UPI",
    status: "Completed",
    date: "Mar 9, 2026",
    transactionId: "TXN123456791",
    bankAccount: "XXXX-XXXX-7890"
  },
  {
    id: "4",
    workerId: "W004",
    workerName: "Vijay Singh",
    photo: "",
    amount: 10000,
    paymentType: "Advance",
    paymentMethod: "Cash",
    status: "Pending",
    date: "Mar 11, 2026",
    transactionId: "TXN123456792",
    bankAccount: "XXXX-XXXX-8901"
  },
  {
    id: "5",
    workerId: "W005",
    workerName: "Arun Sharma",
    photo: "",
    amount: 3500,
    paymentType: "Overtime",
    paymentMethod: "Bank Transfer",
    status: "Failed",
    date: "Mar 8, 2026",
    transactionId: "TXN123456793",
    bankAccount: "XXXX-XXXX-9012"
  }
];

export function PaymentsPage() {
  const getStatusBadge = (status: Payment["status"]) => {
    const config = {
      Completed: { bg: "bg-[#059669]", text: "text-white", icon: CheckCircle },
      Processing: { bg: "bg-[#0891B2]", text: "text-white", icon: Clock },
      Pending: { bg: "bg-[#D97706]", text: "text-white", icon: Clock },
      Failed: { bg: "bg-[#DC2626]", text: "text-white", icon: XCircle }
    };
    const c = config[status];
    const Icon = c.icon;
    return (
      <Badge className={`${c.bg} ${c.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getPaymentTypeColor = (type: Payment["paymentType"]) => {
    const colors = {
      Salary: "bg-[#0891B2]/10 text-[#0891B2] border-[#0891B2]",
      Bonus: "bg-[#059669]/10 text-[#059669] border-[#059669]",
      Overtime: "bg-[#D97706]/10 text-[#D97706] border-[#D97706]",
      Advance: "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]"
    };
    return colors[type];
  };

  const totalPayments = 1247;
  const completedPayments = 1089;
  const processingPayments = 85;
  const pendingPayments = 58;
  const failedPayments = 15;
  const totalAmount = 32450000;
  const paidAmount = 28920000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Management</h1>
          <p className="text-gray-500">Process and manage worker payments and transactions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
            <Download className="w-4 h-4 mr-2" />
            Export Transactions
          </Button>
          <Button className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#059669] text-white">
            <Send className="w-4 h-4 mr-2" />
            Process Bulk Payment
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="p-6 shadow-lg border-l-4 border-[#0891B2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#0891B2]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{totalPayments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#059669]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#059669]/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#059669]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-[#059669]">{completedPayments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#0891B2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#0891B2]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-[#0891B2]">{processingPayments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#D97706]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-[#D97706]">{pendingPayments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#DC2626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-[#DC2626]">{failedPayments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg bg-gradient-to-br from-[#059669]/10 to-transparent border-l-4 border-[#059669]">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Amount Paid</p>
            <p className="text-xl font-bold text-[#059669]">₹{(paidAmount / 10000000).toFixed(2)}Cr</p>
            <p className="text-xs text-gray-600 mt-1">of ₹{(totalAmount / 10000000).toFixed(2)}Cr</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 shadow-lg bg-gradient-to-r from-[#0891B2]/10 to-transparent">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Payment Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button className="bg-gradient-to-r from-[#0891B2] to-[#06B6D4] hover:from-[#0e7490] hover:to-[#0891B2] text-white h-auto py-4 flex-col gap-2">
            <DollarSign className="w-6 h-6" />
            <span>Process Monthly Salary</span>
          </Button>
          <Button className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#059669] text-white h-auto py-4 flex-col gap-2">
            <Users className="w-6 h-6" />
            <span>Pay Selected Workers</span>
          </Button>
          <Button className="bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#D97706] text-white h-auto py-4 flex-col gap-2">
            <Send className="w-6 h-6" />
            <span>Send Bonus Payments</span>
          </Button>
          <Button className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#7C3AED] text-white h-auto py-4 flex-col gap-2">
            <Download className="w-6 h-6" />
            <span>Download Payslips</span>
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Select defaultValue="thismonth">
                <SelectTrigger className="pl-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7">Last 7 Days</SelectItem>
                  <SelectItem value="thismonth">This Month</SelectItem>
                  <SelectItem value="lastmonth">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Type</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
                <SelectItem value="advance">Advance</SelectItem>
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
            <Input type="text" placeholder="Worker name or ID..." />
          </div>

          <Button variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Payment Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-0">
          <Card className="shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={payment.photo} />
                          <AvatarFallback className="bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-white">
                            {payment.workerName.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{payment.workerName}</p>
                          <p className="text-sm text-gray-500">{payment.workerId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getPaymentTypeColor(payment.paymentType)} border`}>
                        {payment.paymentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-bold text-[#059669]">₹{payment.amount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-gray-600">{payment.paymentMethod}</TableCell>
                    <TableCell className="text-gray-600">{payment.date}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{payment.transactionId}</code>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" className="hover:bg-[#0891B2]/10 hover:border-[#0891B2] hover:text-[#0891B2]">
                          View Details
                        </Button>
                        {payment.status === "Pending" && (
                          <Button size="sm" className="bg-[#059669] hover:bg-[#047857] text-white">
                            Process
                          </Button>
                        )}
                        {payment.status === "Failed" && (
                          <Button size="sm" className="bg-[#D97706] hover:bg-[#B45309] text-white">
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Other tabs would filter the same data */}
        <TabsContent value="pending">
          <Card className="p-8 text-center shadow-lg">
            <p className="text-gray-500">Showing pending payments only...</p>
          </Card>
        </TabsContent>
        <TabsContent value="processing">
          <Card className="p-8 text-center shadow-lg">
            <p className="text-gray-500">Showing processing payments only...</p>
          </Card>
        </TabsContent>
        <TabsContent value="completed">
          <Card className="p-8 text-center shadow-lg">
            <p className="text-gray-500">Showing completed payments only...</p>
          </Card>
        </TabsContent>
        <TabsContent value="failed">
          <Card className="p-8 text-center shadow-lg">
            <p className="text-gray-500">Showing failed payments only...</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Breakdown</h3>
          <div className="space-y-3">
            {[
              { method: "Bank Transfer", count: 892, percentage: 71.5, color: "bg-[#0891B2]" },
              { method: "UPI", count: 285, percentage: 22.9, color: "bg-[#059669]" },
              { method: "Cash", count: 70, percentage: 5.6, color: "bg-[#D97706]" }
            ].map((item) => (
              <div key={item.method}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.method}</span>
                  <span className="text-sm text-gray-600">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-lg lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {payments.slice(0, 3).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#0891B2] transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={payment.photo} />
                    <AvatarFallback className="bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-white text-sm">
                      {payment.workerName.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{payment.workerName}</p>
                    <p className="text-sm text-gray-500">{payment.paymentType} • {payment.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#059669]">₹{payment.amount.toLocaleString()}</p>
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">1-5</span> of{" "}
          <span className="font-semibold">{totalPayments}</span> payments
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
