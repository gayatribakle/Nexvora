import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "./ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  iconBgColor: string;
  iconColor: string;
}

export function StatCard({ title, value, icon: Icon, trend, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card className="bg-white border border-gray-200 p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl font-semibold text-[#0F172A]">{value}</h3>
        </div>
        <div className={`${iconBgColor} ${iconColor} w-10 h-10 rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className="flex items-center gap-1 text-sm">
          {trend > 0 ? (
            <>
              <ArrowUp className="w-4 h-4 text-[#059669]" />
              <span className="text-[#059669]">{Math.abs(trend)}% from last week</span>
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4 text-[#DC2626]" />
              <span className="text-[#DC2626]">{Math.abs(trend)}% from last week</span>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
