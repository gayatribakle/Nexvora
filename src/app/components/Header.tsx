import { Bell, Hexagon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  role: "admin" | "worker";
  userName: string;
  notificationCount?: number;
}

export function Header({ role, userName, notificationCount = 3 }: HeaderProps) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
      <div className="h-full px-6 flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Left - Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#06B6D4] rounded-lg flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-xl font-semibold text-[#0F172A]">Nexvora</span>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#DC2626] rounded-full text-white text-xs flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-[#06B6D4] text-white text-sm">
                    {userName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">{role === "admin" ? "Administrator" : "Worker"}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}