import { Clock } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ViolationCardProps {
  workerName: string;
  violationType: string;
  fineAmount: number;
  timestamp: string;
  imageUrl: string;
  status: "Pending" | "Approved" | "Rejected";
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export function ViolationCard({
  workerName,
  violationType,
  fineAmount,
  timestamp,
  imageUrl,
  status,
  onApprove,
  onReject,
  showActions = true,
}: ViolationCardProps) {
  const getViolationColor = (type: string) => {
    if (type.toLowerCase().includes("helmet")) return "bg-[#DC2626] text-white";
    if (type.toLowerCase().includes("garbage")) return "bg-[#D97706] text-white";
    if (type.toLowerCase().includes("tap")) return "bg-[#06B6D4] text-white";
    return "bg-gray-500 text-white";
  };

  const getStatusColor = (status: string) => {
    if (status === "Approved") return "bg-[#059669] text-white";
    if (status === "Rejected") return "bg-[#DC2626] text-white";
    return "bg-[#D97706] text-white";
  };

  return (
    <Card className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        <ImageWithFallback
          src={imageUrl}
          alt="Violation snapshot"
          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[#0F172A] truncate">{workerName}</h4>
              <Badge className={`${getViolationColor(violationType)} mt-1.5 text-xs`}>
                {violationType}
              </Badge>
            </div>
            <Badge className={getStatusColor(status)}>{status}</Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Clock className="w-4 h-4" />
            <span>{timestamp}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-[#DC2626]">
              ₹{fineAmount}
            </div>

            {showActions && status === "Pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={onReject}
                  variant="outline"
                  className="text-[#DC2626] border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={onApprove}
                  className="bg-[#059669] hover:bg-[#047857] text-white"
                >
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
